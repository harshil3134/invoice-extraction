// src/components/ImageUpload/ImagePreview.jsx
import React from 'react';

function ImagePreview({ imagePreview, activeTab }) {
  return (
    <div className="relative w-full h-64 rounded-md overflow-hidden border border-gray-200">
      {activeTab === "preview" ? (
        <img 
          src={imagePreview} 
          alt="Preview" 
          className="w-full h-full object-contain"
        />
      ) : (
        <div className="relative w-full h-full">
          <img 
            src={imagePreview} 
            alt="Bounding Box View" 
            className="w-full h-full object-contain opacity-90"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            {/* This is a placeholder for the actual bounding box detection that would be implemented */}
            <div className="border-2 border-blue-500 bg-blue-100 bg-opacity-20 w-3/4 h-3/4 flex items-center justify-center">
              <span className="text-blue-800 font-medium bg-white bg-opacity-70 px-2 py-1 rounded text-sm">
                Bounding Box Detection
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImagePreview;