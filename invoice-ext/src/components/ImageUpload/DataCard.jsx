// src/components/ImageUpload/DataCard.jsx
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileJson, FileSpreadsheet, Edit } from 'lucide-react';

function DataCard({ jsonData, isLoading, handleEdit, handleDownloadJSON, handleDownloadExcel }) {
  return (
    <Card className="w-full md:w-1/2">
      <CardHeader>
        <CardTitle>Extracted Data</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingState />
        ) : jsonData ? (
          <JsonDataDisplay 
            jsonData={jsonData}
            handleEdit={handleEdit}
            handleDownloadJSON={handleDownloadJSON}
            handleDownloadExcel={handleDownloadExcel}
          />
        ) : (
          <EmptyState />
        )}
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="border rounded-lg p-12 flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-gray-700">Processing image...</p>
    </div>
  );
}

function JsonDataDisplay({ jsonData, handleEdit, handleDownloadJSON, handleDownloadExcel }) {
  return (
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
  );
}

function EmptyState() {
  return (
    <div className="border rounded-lg p-12 flex flex-col items-center justify-center text-center">
      <Download className="h-12 w-12 text-gray-400 mb-4" />
      <p className="text-lg font-medium text-gray-700 mb-2">No Data Yet</p>
      <p className="text-sm text-gray-500">Upload an image to extract data</p>
    </div>
  );
}

export default DataCard;