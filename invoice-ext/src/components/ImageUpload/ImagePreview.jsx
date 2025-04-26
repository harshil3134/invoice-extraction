// src/components/ImageUpload/ImagePreview.jsx
import React from 'react';

function ImagePreview({ imagePreview, activeTab,boundingBoxImageUrl }) {
  return (
    <div className="relative w-full h-64 rounded-md overflow-hidden border border-gray-200">
      {activeTab === "preview" ? (
        <img 
          src={imagePreview} 
          alt="Preview" 
          className="w-full h-full object-contain"
        />
        
      ) : 
      (
        <img 
          src={boundingBoxImageUrl} 
          alt="Bounding Box View" 
          className="w-full h-full object-contain"
        />
      )
      }
    </div>
  );
}

export default ImagePreview;