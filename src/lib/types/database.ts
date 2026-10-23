export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "admin" | "staff";
export type OrderStatus = "pending" | "validated" | "rejected";

export interface GeoJsonPolygon {
  type: "Polygon";
  coordinates: number[][][]; // [[[lng, lat], [lng, lat], ...]]
}

export interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface DatabaseProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  category: string;
  image_url: string | null;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseDeliveryZone {
  id: string;
  name: string;
  polygon: GeoJsonPolygon;
  active: boolean;
  delivery_fee: number;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseOrder {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  customer_address: string;
  latitude: number;
  longitude: number;
  status: OrderStatus;
  zone_id: string | null;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export interface DatabaseOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at">;
        Update: Partial<Omit<Profile, "id">>;
      };
      products: {
        Row: DatabaseProduct;
        Insert: Omit<DatabaseProduct, "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Omit<DatabaseProduct, "id">>;
      };
      delivery_zones: {
        Row: DatabaseDeliveryZone;
        Insert: Omit<DatabaseDeliveryZone, "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Omit<DatabaseDeliveryZone, "id">>;
      };
      orders: {
        Row: DatabaseOrder;
        Insert: Omit<DatabaseOrder, "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Omit<DatabaseOrder, "id">>;
      };
      order_items: {
        Row: DatabaseOrderItem;
        Insert: Omit<DatabaseOrderItem, "id" | "created_at"> & { id?: string };
        Update: Partial<Omit<DatabaseOrderItem, "id">>;
      };
    };
  };
}
