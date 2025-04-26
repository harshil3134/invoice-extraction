import json
import cv2
import pytesseract
import numpy as np
import re
import pandas as pd
from ultralytics import YOLO

# ---------------------- Set Tesseract Path (Windows only) ----------------------
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# ---------------------- Step 1: Load YOLO model and detect ----------------------
model = YOLO("runs/best.pt")  # Path to your trained model
image_path = "dataset/images/test/Template35_Instance98.jpg"
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

with open("output.json", "w") as f:
    json.dump(output_data, f, indent=4)

print("Bounding box details saved to output.json")
# Save the image with bounding boxes
result.save(save_dir="output_images")  # Save the image with bounding boxes
print("Image with bounding boxes saved to 'output_images' directory")

result.show()

# ---------------------- Step 2: OCR & Table Parsing ----------------------
image = cv2.imread(image_path)

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

with open("output.json", "r") as f:
    yolo_data = json.load(f)

extracted_data = {}
for obj in yolo_data:
    label = obj['label']
    x1, y1, x2, y2 = map(int, obj['bounding_box'].values())
    cropped_img = image[y1:y2, x1:x2]

    if label.upper() == "TABLE":
        extracted_data[label] = extract_and_parse_table(cropped_img)
    else:
        extracted_data[label] = extract_field_text(cropped_img)

with open("ocr_output.json", "w") as f:
    json.dump(extracted_data, f, indent=4)

print("OCR with table parsing complete. Output saved to ocr_output.json")

# ---------------------- Step 3: Clean the OCR Output ----------------------
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

def clean_invoice_data(data, prefixes):
    cleaned_data = {}
    for key, value in data.items():
        if isinstance(value, str) and key in prefixes:
            value = re.sub(prefixes[key], "", value).strip()
        cleaned_data[key] = value
    return cleaned_data

final_output = clean_invoice_data(extracted_data, prefixes_to_remove)

with open("final_output.json", "w") as json_file:
    json.dump(final_output, json_file, indent=4)

print("Cleaned data saved to final_output.json")

# ---------------------- Step 4: Save to Excel ----------------------
json_file_path = "final_output.json"
excel_file_path = "invoice_data.xlsx"

with open(json_file_path, "r", encoding="utf-8") as f:
    data = json.load(f)

table_data = data.pop("TABLE", None)
main_df = pd.DataFrame([data])

with pd.ExcelWriter(excel_file_path, engine='xlsxwriter') as writer:
    main_df.to_excel(writer, sheet_name="Invoice Data", index=False)
    if table_data:
        table_df = pd.DataFrame.from_dict(table_data, orient='index')
        table_df.index.name = "Row"
        table_df.reset_index(inplace=True)
        table_df.to_excel(writer, sheet_name="Table Data", index=False)

print(f"Excel file saved as '{excel_file_path}' with two sheets.")
