
import React, { useState, useCallback } from 'react';
import { WardrobeView } from './components/WardrobeView';
import { DailyLookView } from './components/DailyLookView';
import { TryOnView } from './components/TryOnView';
import { ShoppingView } from './components/ShoppingView';
import { StyleProfileView } from './components/StyleProfileView';
import { WardrobeIcon, ShirtIcon, SparklesIcon, ShoppingBagIcon, UserIcon } from './components/Icons';
import type { ClothingItem, UserProfile } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';

type View = 'wardrobe' | 'daily' | 'try-on' | 'shopping' | 'profile';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('wardrobe');
  const [wardrobe, setWardrobe] = useLocalStorage<ClothingItem[]>('wardrobe', []);
  const [userProfile, setUserProfile] = useLocalStorage<UserProfile>('userProfile', {
    skinTone: '',
    colorPalette: [],
    preferredStyles: ['casual', 'chic'],
    region: 'US',
  });

  const updateLaundry = useCallback(() => {
    const now = new Date().getTime();
    // FIX: Explicitly type `updatedWardrobe` as `ClothingItem[]` to fix a TypeScript type inference issue where the 'status' property was being widened to `string`.
    const updatedWardrobe: ClothingItem[] = wardrobe.map(item => {
      if (item.status === 'laundry' && item.laundryUntil && now > item.laundryUntil) {
        return { ...item, status: 'available', laundryUntil: undefined };
      }
      return item;
    });
    setWardrobe(updatedWardrobe);
  }, [wardrobe, setWardrobe]);

  React.useEffect(() => {
    const interval = setInterval(updateLaundry, 60 * 60 * 1000); // Check every hour
    updateLaundry(); // Initial check
    return () => clearInterval(interval);
  }, [updateLaundry]);

  const renderView = () => {
    switch (activeView) {
      case 'wardrobe':
        return <WardrobeView wardrobe={wardrobe} setWardrobe={setWardrobe} />;
      case 'daily':
        return <DailyLookView wardrobe={wardrobe} setWardrobe={setWardrobe} userProfile={userProfile} />;
      case 'try-on':
        return <TryOnView />;
      case 'shopping':
        return <ShoppingView wardrobe={wardrobe} userProfile={userProfile} />;
      case 'profile':
        return <StyleProfileView userProfile={userProfile} setUserProfile={setUserProfile} />;
      default:
        return <WardrobeView wardrobe={wardrobe} setWardrobe={setWardrobe} />;
    }
  };
  
  const navItems: { view: View, label: string, icon: React.ReactNode }[] = [
    { view: 'wardrobe', label: 'Wardrobe', icon: <WardrobeIcon /> },
    { view: 'daily', label: 'Daily Look', icon: <ShirtIcon /> },
    { view: 'try-on', label: 'Try-On', icon: <SparklesIcon /> },
    { view: 'shopping', label: 'Shopping', icon: <ShoppingBagIcon /> },
    { view: 'profile', label: 'Profile', icon: <UserIcon /> },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pocket Fashion AI</h1>
          <p className="text-sm text-gray-500">Your personal AI stylist</p>
        </div>
      </header>
      
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-20">
        {renderView()}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-200 shadow-t-md z-10">
        <div className="max-w-7xl mx-auto flex justify-around">
          {navItems.map(item => (
            <button
              key={item.view}
              onClick={() => setActiveView(item.view)}
              className={`flex flex-col items-center justify-center p-2 w-full text-xs sm:text-sm focus:outline-none transition-colors duration-200 ${
                activeView === item.view ? 'text-indigo-600' : 'text-gray-500 hover:text-indigo-600'
              }`}
            >
              <div className="w-6 h-6 mb-1">{item.icon}</div>
              {item.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default App;