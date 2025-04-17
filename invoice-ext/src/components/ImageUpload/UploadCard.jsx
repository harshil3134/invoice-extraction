// src/components/ImageUpload/UploadCard.jsx
import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload } from 'lucide-react';
import ImagePreview from './ImagePreview';

function UploadCard({ imagePreview, handleImageUpload, handleReset }) {
  const [activeTab, setActiveTab] = useState("preview");
  const fileInputRef = useRef(null);

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        handleImageUpload(file);
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  return (
    <Card className="w-full md:w-1/2">
      <CardHeader>
        <CardTitle>Upload Image</CardTitle>
      </CardHeader>
      <CardContent>
        {!imagePreview ? (
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center text-center"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">UPLOAD IMAGE</p>
            <p className="text-sm text-gray-500 mb-6">Upload a document image to extract data</p>
            <Button 
              className="cursor-pointer"
              onClick={handleUploadClick}
            >
              Choose File
            </Button>
            <input 
              ref={fileInputRef}
              type="file" 
              className="hidden" 
              accept="image/*" 
              onChange={onFileChange}
            />
            <p className="text-xs text-gray-500 mt-4">Or drag and drop an image file here</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <ImagePreview 
              imagePreview={imagePreview} 
              activeTab={activeTab}
            />
            <div className="flex gap-4 mt-4">
              <Button
                variant="outline"
                onClick={handleReset}
              >
                <Upload className="h-4 w-4 mr-2" />
                Change
              </Button>
              <Button 
                className="cursor-pointer"
                onClick={handleUploadClick}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload New
              </Button>
              <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                accept="image/*" 
                onChange={onFileChange}
              />
            </div>
          </div>
        )}
        
        {imagePreview && (
          <div className="mt-6">
            <Tabs 
              defaultValue="preview" 
              className="w-full" 
              value={activeTab} 
              onValueChange={setActiveTab}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="preview">Preview Image</TabsTrigger>
                <TabsTrigger value="boundingBox">Bounding Box</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default UploadCard;