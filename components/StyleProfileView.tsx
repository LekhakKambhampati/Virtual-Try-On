import React, { useState } from 'react';
import type { UserProfile } from '../types';
import { FileUpload } from './common/FileUpload';
import { LoadingSpinner } from './common/LoadingSpinner';
import * as geminiService from '../services/geminiService';

interface StyleProfileViewProps {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
}

export const StyleProfileView: React.FC<StyleProfileViewProps> = ({ userProfile, setUserProfile }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localProfile, setLocalProfile] = useState<UserProfile>(userProfile);

  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#');

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await geminiService.analyzeSkinTone(file);
      setLocalProfile(prev => ({ ...prev, skinTone: result.skinTone, colorPalette: result.colorPalette }));
    } catch (err) {
      setError('Failed to analyze skin tone. Please try a different photo.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    setUserProfile(localProfile);
    alert('Profile saved!');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setLocalProfile(prev => ({...prev, [name]: value}));
  };
  
  const handleStylesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setLocalProfile(prev => ({...prev, preferredStyles: value.split(',').map(s => s.trim())}));
  };

  const handleAddColor = () => {
    if (newColorName.trim() && /^#([0-9A-F]{3}){1,2}$/i.test(newColorHex)) {
      setLocalProfile(prev => ({
        ...prev,
        colorPalette: [...prev.colorPalette, { name: newColorName, hex: newColorHex.toUpperCase() }],
      }));
      setNewColorName('');
      setNewColorHex('#');
    } else {
      alert('Please enter a valid color name and a 3 or 6-digit hex code (e.g., #F00 or #FF0000).');
    }
  };

  const handleRemoveColor = (hexToRemove: string) => {
    setLocalProfile(prev => ({
      ...prev,
      colorPalette: prev.colorPalette.filter(color => color.hex !== hexToRemove),
    }));
  };

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (!value.startsWith('#')) {
      value = '#' + value.replace(/#/g, '');
    }
    setNewColorHex(value.toUpperCase());
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">My Style Profile</h2>
        <div className="p-6 bg-white rounded-lg shadow-md space-y-6">
            <div>
                <h3 className="font-semibold mb-2 text-lg">Analyze Your Colors</h3>
                <p className="text-sm text-gray-600 mb-4">Upload a clear, well-lit photo of yourself to get a recommended color palette.</p>
                {isLoading ? <LoadingSpinner message="Analyzing your colors..." /> : <FileUpload onFileUpload={handleFileUpload} label="Upload your photo" id="profile-photo-upload"/>}
                {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
                
                {localProfile.skinTone && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <p className="font-semibold">Analyzed Skin Tone:</p>
                        <p className="text-indigo-600">{localProfile.skinTone}</p>
                    </div>
                )}
                {localProfile.colorPalette.length > 0 && (
                     <div className="mt-4">
                        <p className="font-semibold mb-2">Your Color Palette:</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {localProfile.colorPalette.map(color => (
                                <div key={color.hex} className="relative group p-2 border rounded-lg text-center shadow-sm bg-white">
                                    <div className="w-full h-20 rounded-md mx-auto mb-2 border" style={{ backgroundColor: color.hex }}></div>
                                    <p className="font-medium text-sm capitalize truncate">{color.name}</p>
                                    <p className="text-xs text-gray-500 font-mono uppercase">{color.hex}</p>
                                    <button 
                                        onClick={() => handleRemoveColor(color.hex)}
                                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        aria-label={`Remove ${color.name}`}
                                    >
                                        &times;
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="border-t pt-6">
                <h3 className="font-semibold mb-2 text-lg">Add Custom Color</h3>
                <div className="flex flex-col sm:flex-row items-end gap-4">
                    <div className="flex-grow w-full">
                        <label htmlFor="new-color-name" className="block text-sm font-medium text-gray-700">Color Name</label>
                        <input
                            type="text"
                            id="new-color-name"
                            value={newColorName}
                            onChange={(e) => setNewColorName(e.target.value)}
                            placeholder="e.g., Forest Green"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                    <div className="w-full sm:w-auto">
                        <label htmlFor="new-color-hex" className="block text-sm font-medium text-gray-700">Hex Code</label>
                        <input
                            type="text"
                            id="new-color-hex"
                            value={newColorHex}
                            onChange={handleHexChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
                            maxLength={7}
                        />
                    </div>
                    <button
                        onClick={handleAddColor}
                        className="w-full sm:w-auto bg-gray-700 text-white py-2 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                        Add
                    </button>
                </div>
            </div>

            <div className="border-t pt-6">
                <h3 className="font-semibold mb-4 text-lg">My Preferences</h3>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="region" className="block text-sm font-medium text-gray-700">Fashion Region</label>
                        <select
                        id="region"
                        name="region"
                        value={localProfile.region}
                        onChange={handleInputChange}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                            <option>US</option>
                            <option>UK</option>
                            <option>India</option>
                            <option>Japan</option>
                            <option>Brazil</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="styles" className="block text-sm font-medium text-gray-700">My Favorite Styles (comma separated)</label>
                        <input
                            type="text"
                            id="styles"
                            name="preferredStyles"
                            value={localProfile.preferredStyles.join(', ')}
                            onChange={handleStylesChange}
                            placeholder="e.g., casual, chic, minimalist"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                </div>
            </div>
            <button
                onClick={handleSave}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                Save Profile
            </button>
        </div>
      </div>
    </div>
  );
};
