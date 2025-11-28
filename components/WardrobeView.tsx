import React, { useState } from 'react';
import type { ClothingItem } from '../types';
import { FileUpload } from './common/FileUpload';
import { LoadingSpinner } from './common/LoadingSpinner';
import * as geminiService from '../services/geminiService';

interface WardrobeViewProps {
  wardrobe: ClothingItem[];
  setWardrobe: React.Dispatch<React.SetStateAction<ClothingItem[]>>;
}

const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export const WardrobeView: React.FC<WardrobeViewProps> = ({ wardrobe, setWardrobe }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const analysis = await geminiService.analyzeClothingItem(file);
      const imageUrl = await fileToDataUrl(file);
      const newItem: ClothingItem = {
        ...analysis,
        id: new Date().toISOString(),
        imageUrl,
        status: 'available',
      };
      setWardrobe(prev => [newItem, ...prev]);
    } catch (err) {
      setError('Failed to analyze clothing item. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLaundryStatus = (id: string) => {
    setWardrobe(prev => prev.map(item => {
      if (item.id === id) {
        if (item.status === 'available') {
            const twoDaysFromNow = new Date().getTime() + 2 * 24 * 60 * 60 * 1000;
            return { ...item, status: 'laundry', laundryUntil: twoDaysFromNow };
        }
        return { ...item, status: 'available', laundryUntil: undefined };
      }
      return item;
    }));
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Add New Item</h2>
        <div className="p-6 bg-white rounded-lg shadow-md">
            {isLoading ? <LoadingSpinner message="Analyzing your item..." /> : 
            <>
                <FileUpload onFileUpload={handleFileUpload} label="Upload a photo of your clothing" id="wardrobe-upload" />
                {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
            </>
            }
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold mb-4">My Wardrobe ({wardrobe.length})</h2>
        {wardrobe.length === 0 && !isLoading ? (
            <p className="text-center text-gray-500 py-8">Your wardrobe is empty. Add some items to get started!</p>
        ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {wardrobe.map(item => (
                <div key={item.id} className="relative group bg-white rounded-lg shadow-md overflow-hidden">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-48 object-cover"/>
                    <div className="p-3">
                        <h3 className="font-semibold truncate">{item.name}</h3>
                        <p className="text-sm text-gray-500 capitalize">{item.color} {item.type}</p>
                    </div>
                    <div className="absolute top-2 right-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${item.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {item.status}
                        </span>
                    </div>
                     <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity duration-300 flex items-center justify-center">
                        <button onClick={() => toggleLaundryStatus(item.id)} className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white text-gray-800 text-sm px-3 py-1 rounded-full">
                            {item.status === 'available' ? 'Send to Laundry' : 'Mark as Clean'}
                        </button>
                    </div>
                </div>
            ))}
            </div>
        )}
      </div>
    </div>
  );
};
