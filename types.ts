export interface ColorInfo {
  name: string;
  hex: string;
}

export interface ClothingItem {
  id: string;
  name: string;
  type: string;
  color: string;
  pattern: string;
  style: string;
  imageUrl: string;
  status: 'available' | 'laundry';
  laundryUntil?: number;
}

export interface UserProfile {
  skinTone: string;
  colorPalette: ColorInfo[];
  preferredStyles: string[];
  region: string;
}
