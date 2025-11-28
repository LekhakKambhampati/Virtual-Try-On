
import React, { useState, useEffect, useCallback } from 'react';
import type { ClothingItem, UserProfile } from '../types';
import * as geminiService from '../services/geminiService';
import { LoadingSpinner } from './common/LoadingSpinner';

interface ShoppingViewProps {
  wardrobe: ClothingItem[];
  userProfile: UserProfile;
}

export const ShoppingView: React.FC<ShoppingViewProps> = ({ wardrobe, userProfile }) => {
  const [trends, setTrends] = useState<string | null>(null);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [trendsError, setTrendsError] = useState<string | null>(null);
  
  const [itemDescription, setItemDescription] = useState('');
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  
  const fetchTrends = useCallback(async () => {
    setTrendsLoading(true);
    setTrendsError(null);
    try {
      const result = await geminiService.getFashionTrends(userProfile.region || 'US');
      setTrends(result);
    } catch (err) {
      setTrendsError('Failed to fetch fashion trends.');
      console.error(err);
    } finally {
      setTrendsLoading(false);
    }
  }, [userProfile.region]);

  useEffect(() => {
    fetchTrends();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile.region]);

  const handleGetSuggestion = async () => {
      if (!itemDescription) return;
      setSuggestionLoading(true);
      setSuggestionError(null);
      setSuggestion(null);
      try {
          const result = await geminiService.getShoppingSuggestions(itemDescription, wardrobe, userProfile);
          setSuggestion(result);
      } catch (err) {
          setSuggestionError('Failed to get shopping suggestion.');
          console.error(err);
      } finally {
          setSuggestionLoading(false);
      }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Latest Fashion Trends</h2>
        <div className="p-6 bg-white rounded-lg shadow-md">
            {trendsLoading && <LoadingSpinner message="Scanning the fashion world..." />}
            {trendsError && <p className="text-red-500 text-center">{trendsError}</p>}
            {trends && <div className="prose max-w-none">{trends}</div>}
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold mb-4">Get Purchase Advice</h2>
        <div className="p-6 bg-white rounded-lg shadow-md space-y-4">
            <div>
                <label htmlFor="item-description" className="block text-sm font-medium text-gray-700">What are you thinking of buying?</label>
                <input
                    type="text"
                    id="item-description"
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    placeholder="e.g., a black leather jacket"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
            </div>
            <button
                onClick={handleGetSuggestion}
                disabled={suggestionLoading || !itemDescription}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
            >
                {suggestionLoading ? 'Analyzing...' : 'Ask AI Stylist'}
            </button>
        </div>
      </div>
      {suggestionLoading && <LoadingSpinner message="Checking if it's a good fit..." />}
      {suggestionError && <p className="text-red-500 text-center">{suggestionError}</p>}
      {suggestion && (
        <div className="p-6 bg-white rounded-lg shadow-md animate-fade-in">
          <h3 className="text-xl font-bold mb-4">Stylist's Advice</h3>
          <div className="prose max-w-none">{suggestion}</div>
        </div>
      )}
    </div>
  );
};
