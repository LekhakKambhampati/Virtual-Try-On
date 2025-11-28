
import React, { useState } from 'react';
import { FileUpload } from './common/FileUpload';
import { LoadingSpinner } from './common/LoadingSpinner';
import * as geminiService from '../services/geminiService';

export const TryOnView: React.FC = () => {
  const [personFile, setPersonFile] = useState<File | null>(null);
  const [upperClothingFile, setUpperClothingFile] = useState<File | null>(null);
  const [lowerClothingFile, setLowerClothingFile] = useState<File | null>(null);
  const [accessoryFile, setAccessoryFile] = useState<File | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTryOn = async () => {
    if (!personFile || (!upperClothingFile && !lowerClothingFile && !accessoryFile)) {
      setError("Please upload your photo and at least one clothing item.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setResultImage(null);
    try {
      const clothingItems = {
        upper: upperClothingFile,
        lower: lowerClothingFile,
        accessory: accessoryFile,
      };
      const generatedImage = await geminiService.performVirtualTryOn(personFile, clothingItems);
      setResultImage(generatedImage);
    } catch (err) {
      setError("Failed to generate try-on image. Please try different images.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Virtual Try-On</h2>
        <p className="text-gray-600 mb-4">Upload a photo of yourself (clear, front-facing) and photos of clothing items. The AI will dress you up! Provide at least one clothing item.</p>
        <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                    <h3 className="font-semibold mb-2 text-center">1. Your Photo</h3>
                    <FileUpload onFileUpload={setPersonFile} label="Upload your photo" id="person-photo-upload" />
                    {personFile && <img src={URL.createObjectURL(personFile)} alt="Person preview" className="mt-4 rounded-lg h-40 w-auto mx-auto"/>}
                </div>
                <div>
                    <h3 className="font-semibold mb-2 text-center">2. Upper Clothing</h3>
                    <FileUpload onFileUpload={setUpperClothingFile} label="e.g., shirt, t-shirt" id="upper-clothing-upload" />
                    {upperClothingFile && <img src={URL.createObjectURL(upperClothingFile)} alt="Upper clothing preview" className="mt-4 rounded-lg h-40 w-auto mx-auto"/>}
                </div>
                <div>
                    <h3 className="font-semibold mb-2 text-center">3. Lower Clothing</h3>
                    <FileUpload onFileUpload={setLowerClothingFile} label="e.g., pants, skirt" id="lower-clothing-upload" />
                    {lowerClothingFile && <img src={URL.createObjectURL(lowerClothingFile)} alt="Lower clothing preview" className="mt-4 rounded-lg h-40 w-auto mx-auto"/>}
                </div>
                <div>
                    <h3 className="font-semibold mb-2 text-center">4. Accessory</h3>
                    <FileUpload onFileUpload={setAccessoryFile} label="e.g., hat, scarf" id="accessory-upload" />
                    {accessoryFile && <img src={URL.createObjectURL(accessoryFile)} alt="Accessory preview" className="mt-4 rounded-lg h-40 w-auto mx-auto"/>}
                </div>
            </div>
            <div className="mt-8">
                <button
                onClick={handleTryOn}
                disabled={isLoading || !personFile || (!upperClothingFile && !lowerClothingFile && !accessoryFile)}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 font-semibold"
                >
                {isLoading ? 'Generating...' : 'Start Virtual Try-On'}
                </button>
            </div>
        </div>
      </div>
      
      {isLoading && <LoadingSpinner message="Applying fashion magic..." />}
      {error && <p className="text-red-500 text-center">{error}</p>}

      {resultImage && (
        <div className="p-6 bg-white rounded-lg shadow-md animate-fade-in">
          <h3 className="text-xl font-bold mb-4">Here's Your New Look!</h3>
          <img src={resultImage} alt="Virtual try-on result" className="rounded-lg shadow-lg mx-auto max-h-[60vh]"/>
        </div>
      )}
    </div>
  );
};
