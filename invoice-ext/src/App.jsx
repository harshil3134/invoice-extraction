import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import ImageUploadComponent from './ImageUploadComponent'
import ImageUploadContainer from './components/ImageUpload/ImageUploadContainer'

function App() {
  const [count, setCount] = useState(0)

  return (
 <>
   <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto">
        <h1 className="text-2xl font-bold text-center mb-8">Image to Data Converter</h1>
        <ImageUploadContainer />
      </div>
    </div>
 </>
  )
}

export default App
