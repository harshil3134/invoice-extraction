// ImageUploadComponent.jsx
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Download, FileJson, FileSpreadsheet, Edit } from 'lucide-react';

function ImageUploadComponent() {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [jsonData, setJsonData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [activeTab, setActiveTab] = useState("preview");

  // Handle file upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Simulate API response with mock data
      setIsLoading(true);
      setTimeout(() => {
        setJsonData({
          "BUYER": "Monica Fuller",
          "NOTE": "This order is shipped through blue dart courier",
          "TITLE": "COMMERCIAL",
          "SUB_TOTAL": "445.25 $",
          "TABLE": {
            "1": {
              "ITEMS": "Article usually must",
              "QUANTITY": "300",
              "PRICE": "$52 18"
            },
            "2": {
              "ITEMS": "Home collection effect federal",
              "QUANTITY": "300",
              "PRICE": "$5565"
            },
            "3": {
              "ITEMS": "Career foreign child",
              "QUANTITY": "1.00",
              "PRICE": "$25 11"
            },
            "4": {
              "ITEMS": "Vote one",
              "QUANTITY": "5.00",
              "PRICE": "$1933"
            }
          },
          "PAYMENT_DETAILS": "Bank Name State Sank of England",
          "DUE_DATE": "16-Oct-2005",
          "TOTAL": "441.11 $",
          "TAX": "16.61 $",
          "TOTAL_WORDS": "four hundred and forty-one point one one",
          "GSTIN_BUYER": "OQ@AAMFCO376K1 24",
          "GSTIN_SELLER": "12345670 00070007",
          "SELLER_ADDRESS": "16424 Timothy Mission Markville, AK 58294 US",
          "DATE": "28-Apr-2009",
          "DISCOUNT": "12.78",
          "PO_NUMBER": "75",
          "SELLER_SITE": "www.ThompsonandSons.org",
          "SELLER_EMAIL": "melvin40@example.net",
          "Tel": "+(783)572-8210",
          "Email": "bryce74@example.org",
          "Site": "http://aill.com/"
        });
        setIsLoading(false);
      }, 1500);
    }
  };

  // Handle edit JSON
  const handleEdit = () => {
    // In a real app, this would open a modal or navigate to an edit page
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  // Handle download JSON
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
  };

  // Handle download Excel
  const handleDownloadExcel = () => {
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 w-full max-w-6xl mx-auto p-6">
      {/* Left side - Image upload */}
      <Card className="w-full md:w-1/2">
        <CardHeader>
          <CardTitle>Upload Image</CardTitle>
        </CardHeader>
        <CardContent>
          {!imagePreview ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center text-center">
              <Upload className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">UPLOAD IMAGE</p>
              <p className="text-sm text-gray-500 mb-6">Upload a document image to extract data</p>
              <label htmlFor="image-upload">
                <Button className="cursor-pointer">
                  Choose File
                  <input 
                    id="image-upload"
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleImageUpload}
                  />
                </Button>
              </label>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="relative w-full h-64 mb-4 rounded-md overflow-hidden border border-gray-200">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setImage(null);
                    setImagePreview(null);
                    setJsonData(null);
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Change
                </Button>
                <label htmlFor="new-image-upload">
                  <Button className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload New
                    <input 
                      id="new-image-upload"
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleImageUpload}
                    />
                  </Button>
                </label>
              </div>
            </div>
          )}
          
          {imagePreview && (
            <div className="mt-6">
              <Tabs defaultValue="preview" className="w-full" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="preview">Preview Image</TabsTrigger>
                  <TabsTrigger value="boundingBox">Bounding Box</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Right side - JSON data */}
      <Card className="w-full md:w-1/2">
        <CardHeader>
          <CardTitle>Extracted Data</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="border rounded-lg p-12 flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-700">Processing image...</p>
            </div>
          ) : jsonData ? (
            <div className="relative">
              <div className="absolute top-2 right-2">
                <Button size="sm" onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
              <div className="border rounded-lg p-4 bg-gray-50 h-80 overflow-auto font-mono text-sm">
                <pre>{JSON.stringify(jsonData, null, 2)}</pre>
              </div>
              
              <div className="mt-6 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  <span className="font-semibold">527</span> tokens | <span className="font-semibold">534</span> bytes
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleDownloadJSON}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <FileJson className="h-4 w-4 mr-2" />
                    JSON
                  </Button>
                  <Button 
                    onClick={handleDownloadExcel}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    EXCEL
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="border rounded-lg p-12 flex flex-col items-center justify-center text-center">
              <Download className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">No Data Yet</p>
              <p className="text-sm text-gray-500">Upload an image to extract data</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {showAlert && (
        <div className="fixed bottom-6 right-6">
          <Alert className="bg-green-100 border-green-500 text-green-800 w-64">
            <AlertDescription>
              Feature would be implemented in a production environment
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}

export default ImageUploadComponent;