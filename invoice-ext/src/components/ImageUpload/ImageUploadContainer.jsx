import React, { useState } from 'react';
import UploadCard from './UploadCard';
import DataCard from './DataCard';
import { Alert, AlertDescription } from "@/components/ui/alert";
import * as XLSX from 'xlsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
function ImageUploadContainer() {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [jsonData, setJsonData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [excelUrl, setExcelUrl] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editedJsonText, setEditedJsonText] = useState('');
  const [jsonError, setJsonError] = useState(null);
  const handleImageUpload = async (file) => {
    if (!file) return;
    
    setImage(file);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
    
    // Send the image to the Flask API
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('http://127.0.0.1:5001/extract', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setJsonData(data.data);
      setExcelUrl(data.excel_download_url ? `http://127.0.0.1:5001${data.excel_download_url}` : null);
      showAlertMessage("Image processed successfully!");
    } catch (error) {
      console.error('Error uploading image:', error);
      showAlertMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setImage(null);
    setImagePreview(null);
    setJsonData(null);
    setExcelUrl(null);
  };

  const handleEdit = () => {
    if (!jsonData) {
      showAlertMessage("No data to edit");
      return;
    }
    
    // Format the JSON data with indentation for better readability
    setEditedJsonText(JSON.stringify(jsonData, null, 2));
    setJsonError(null);
    setIsEditModalOpen(true);
  };
 

  const handleGenerateExcel = () => {
    if (!jsonData) {
      showAlertMessage("No data available to generate Excel");
      return;
    }
  
    try {
      const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData];

    // Convert JSON data to a worksheet
    const worksheet = XLSX.utils.json_to_sheet(dataArray);

      // Create a new workbook and append the worksheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Extracted Data");
  
      // Generate a binary Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  
      // Create a Blob from the Excel buffer
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  
      // Create a download link and trigger the download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'extracted-data.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  
      showAlertMessage("Excel file generated and downloaded successfully");
    } catch (error) {
      console.error('Error generating Excel file:', error);
      showAlertMessage(`Error: ${error.message}`);
    }
  };

  const handleSaveEdit = async() => {
    try {
      // Parse the edited text to validate it's proper JSON
      const parsed = JSON.parse(editedJsonText);
      setJsonData(parsed);
      setIsEditModalOpen(false);
      showAlertMessage("JSON data updated successfully");

    } catch (error) {
      setJsonError("Invalid JSON format: " + error.message);
    }
  };

  const handleCancelEdit = () => {
    setIsEditModalOpen(false);
    setJsonError(null);
  };

  const handleDownloadJSON = () => {
    if (!jsonData) return;
    
    const dataStr = JSON.stringify(jsonData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'image-data.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Clean up
    
    showAlertMessage("JSON downloaded successfully");
  };

  const handleDownloadExcel = () => {
    if (!excelUrl) {
      showAlertMessage("Excel download URL not available");
      return;
    }
    
    window.open(excelUrl, '_blank');
    showAlertMessage("Excel download started");
  };

  const showAlertMessage = (message) => {
    setAlertMessage(message);
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 w-full max-w-6xl mx-auto p-6">
      <UploadCard 
        imagePreview={imagePreview}
        handleImageUpload={handleImageUpload}
        handleReset={handleReset}
      />
      
      <DataCard 
        jsonData={jsonData}
        isLoading={isLoading}
        handleEdit={handleEdit}
        handleDownloadJSON={handleDownloadJSON}
        handleDownloadExcel={handleGenerateExcel}
      />
      
      {showAlert && (
        <div className="fixed bottom-6 right-6 z-50">
          <Alert className={`border ${alertMessage.includes('Error') ? 'bg-red-100 border-red-500 text-red-800' : 'bg-green-100 border-green-500 text-green-800'} w-64`}>
            <AlertDescription>{alertMessage}</AlertDescription>
          </Alert>
        </div>
      )}
  <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit JSON Data</DialogTitle>
          </DialogHeader>
          
          <div className="max-h-[60vh] overflow-y-auto">
           
            <Textarea
              className="font-mono min-h-[300px] p-2 w-full text-left"
              value={editedJsonText}
              onChange={(e) => setEditedJsonText(e.target.value)}
            />
          </div>
          
          {jsonError && (
            <div className="text-red-500 text-sm mt-2">
              {jsonError}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelEdit}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

export default ImageUploadContainer;