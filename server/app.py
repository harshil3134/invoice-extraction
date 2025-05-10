from flask import Flask, request, jsonify, send_file
import os
from flask_cors import CORS 
import json
import cv2
import pytesseract
import numpy as np
import re
import pandas as pd
from ultralytics import YOLO
import platform
from werkzeug.utils import secure_filename
import io

app = Flask(__name__)
CORS(app)  

# Create necessary directories
os.makedirs("uploads", exist_ok=True)
os.makedirs("outputs", exist_ok=True)

# Set Tesseract path for Windows if needed
if platform.system() == "Windows":
    pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# Load YOLO model once when server starts
print("Loading YOLO model...")
model = YOLO("model/best.pt")
print("Model loaded successfully!") 

# Helper functions
def extract_and_parse_table(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    resized = cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
    _, thresh = cv2.threshold(resized, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    denoised = cv2.medianBlur(thresh, 3)
    config = r'--oem 3 --psm 4 -c preserve_interword_spaces=1'
    raw_text = pytesseract.image_to_string(denoised, config=config).strip()
    lines = [line for line in raw_text.split("\n") if line.strip() != ""]

    if len(lines) < 2:
        return {"error": "Unable to parse table"}

    headers = re.split(r"\s{2,}", lines[0].strip())
    table_data = {}
    for idx, line in enumerate(lines[1:], start=1):
        columns = re.split(r"\s{2,}", line.strip())
        if len(columns) != len(headers):
            continue
        row_dict = {headers[i]: columns[i] for i in range(len(headers))}
        table_data[str(idx)] = row_dict

    return table_data

def extract_field_text(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    resized = cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
    _, thresh = cv2.threshold(resized, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    config = r'--oem 3 --psm 6'
    text = pytesseract.image_to_string(thresh, config=config).strip()
    return text

def clean_invoice_data(data, prefixes):
    cleaned_data = {}
    for key, value in data.items():
        if isinstance(value, str) and key in prefixes:
            value = re.sub(prefixes[key], "", value).strip()
        cleaned_data[key] = value
    return cleaned_data

def process_invoice_image(image_path):
    """Process invoice image and return extracted data and Excel file path"""
    
    # Step 1: YOLO detection
    results = model(image_path)
    
    output_data = []
    for result in results:
        for box in result.boxes.data:
            x1, y1, x2, y2, conf, cls = box.tolist()
            label = result.names[int(cls)]
            output_data.append({
                "label": label,
                "confidence": conf,
                "bounding_box": {
                    "x1": x1,
                    "y1": y1,
                    "x2": x2,
                    "y2": y2
                }
            })
    for idx, result in enumerate(results):
        img_with_boxes = result.plot()
        
        # Convert RGB to BGR if it's a NumPy array
        if isinstance(img_with_boxes, np.ndarray):
            img_with_boxes_bgr = cv2.cvtColor(img_with_boxes, cv2.COLOR_RGB2BGR)
        else:
            # If it's a PIL image (just in case), convert to NumPy and then BGR
            img_with_boxes = np.array(img_with_boxes)
            img_with_boxes_bgr = cv2.cvtColor(img_with_boxes, cv2.COLOR_RGB2BGR)

    bounding_box_image_path = os.path.join("outputs", f"image_with_boxes_{idx}.jpg")
    cv2.imwrite(bounding_box_image_path, img_with_boxes_bgr)
    print(f"Image with bounding boxes saved to {bounding_box_image_path}")

    # Step 2: OCR & Table Parsing
    image = cv2.imread(image_path)
    
    extracted_data = {}
    for obj in output_data:
        label = obj['label']
        x1, y1, x2, y2 = map(int, obj['bounding_box'].values())
        cropped_img = image[y1:y2, x1:x2]
        
        if label.upper() == "TABLE":
            extracted_data[label] = extract_and_parse_table(cropped_img)
        else:
            extracted_data[label] = extract_field_text(cropped_img)
    
    # Step 3: Clean OCR Output
    prefixes_to_remove = {
        "BUYER": r"(Buyer|Bill to)\s*[:\-]?\s*",
        "SELLER_ADDRESS": r"Address\s*[:\-]?\s*",
        "SELLER_EMAIL": r"(Email|Emall)\s*[:\-]?\s*",
        "TOTAL_WORDS": r"Total\.?\s*in words\s*[:\-]?\s*",
        "TOTAL": r"(TOTAL|BALANCE DUE)\s*[:\-]?\s*",
        "SUB_TOTAL": r"SUB TOTAL\s*[:\-]?\s*",
        "GSTIN_SELLER": r"GSTIN\s*[:\-]?\s*|[()]",
        "GSTIN": r"GSTIN\s*[:\-]?\s*",
        "NUMBER": r"(INVOICE\s*#?|ID\s*|Invoice number\s*)",
        "DATE": r"(Invoice Date|Date)\s*[:\-]?\s*",
        "DUE_DATE": r"(Due Date|Date|Invoice)\s*[:\-]?\s*",
        "TITLE": r"INVOICE\s*",
        "TAX": r"(TAX|VAT \(3.73%\))\s*[:\-]?\s*",
        "DISCOUNT": r"(DISCOUNT|\(2.87%\))\s*[:\-]?\s*",
        "PAYMENT_DETAILS": r"(BankName|Branch Name|Bank Account Number|Bank Swift Code)\s*[:\-]?\s*",
        "GSTIN_BUYER": r"GSTIN\s*[:\-]?\s*",
        "PO_NUMBER": r"PO Number\s*[:\-]?\s*",
        "NOTE": r"Note\s*[:\-]?\s*",
        "GST(7%)": r"GST\(7%\)\s*[:\-]?\s*",
        "GST(9%)": r"GST\(9%\)\s*[:\-]?\s*",
        "SEND_TO": r"SHIP_TO\s*[:\-]?\s*"
    }
    
    final_output = clean_invoice_data(extracted_data, prefixes_to_remove)

    # Step 4: Save to JSON and Excel
    filename = os.path.basename(image_path).split('.')[0]
    json_file_path = f"outputs/{filename}_output.json"
    excel_file_path = f"outputs/{filename}_invoice_data.xlsx"
    
    with open(json_file_path, "w") as f:
        json.dump(final_output, f, indent=4)
    
    table_data = final_output.copy()
    table_data.pop("TABLE", None) if "TABLE" in final_output else None
    main_df = pd.DataFrame([final_output])
    
    with pd.ExcelWriter(excel_file_path, engine='xlsxwriter') as writer:
        main_df.to_excel(writer, sheet_name="Invoice Data", index=False)
        if table_data:
            table_df = pd.DataFrame.from_dict(table_data, orient='index')
            table_df.index.name = "Row"
            table_df.reset_index(inplace=True)
            table_df.to_excel(writer, sheet_name="Table Data", index=False)
    
    return final_output, json_file_path, excel_file_path, bounding_box_image_path

# Routes
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "Invoice extraction service is running"}), 200

@app.route('/extract', methods=['POST'])
def extract_invoice():
    # Check if image file is in request
    if 'image' not in request.files:
        return jsonify({"error": "No image file provided"}), 400
    
    file = request.files['image']
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    # Save uploaded file
    filename = secure_filename(file.filename)
    file_path = os.path.join("uploads", filename)
    file.save(file_path)
    
    try:
        # Process the image
        extracted_data, json_path, excel_path, bounding_box_image_path   = process_invoice_image(file_path)
        
        # Determine response format
        format_type = request.args.get('format', 'json')
        print("in route",extracted_data)
        if format_type == 'excel':
            return send_file(
                excel_path,
                mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                as_attachment=True,
                download_name=os.path.basename(excel_path)
            )
        else:  # Default to JSON
            return jsonify({
                "status": "success",
                "data": extracted_data,
                "excel_download_url": f"/download?file={os.path.basename(excel_path)}",
             "image_download_url": f"/download?file={os.path.basename(bounding_box_image_path)}"
            })
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        # Clean up uploaded file
        if os.path.exists(file_path):
            os.remove(file_path)

@app.route('/download', methods=['GET'])
def download_file():
    file_name = request.args.get('file')
    if not file_name:
        return jsonify({"error": "No file specified"}), 400
    
    file_path = os.path.join("outputs", file_name)
    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404
    
    return send_file(
        file_path,
        as_attachment=True,
        download_name=file_name
    )

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)