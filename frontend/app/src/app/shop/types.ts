export interface Item {
  category: string;
  subcategory: string;
  branch: string;
  name: string;
  pictureURL: string;
  shop: string;
  badges: string[];
  features: string[];
  prices: {
    totalPrice: string;
    unitPrice: string;
    priceBefore: string;
    hasDiscount: boolean;
  };
}
