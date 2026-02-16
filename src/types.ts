// src/types.ts
import type { ReactNode } from 'react';

// ─── Data Models ────────────────────────────────────

export interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price_at_purchase: number;
  product?: { name: string; image_url?: string };
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'assigned'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'canceled';

export interface Order {
  id: number;
  group_id?: string;
  created_at: string;
  total_price: number;
  status: OrderStatus;
  store: { name: string; image_url?: string };
  items: OrderItem[];
  address?: string;
}

export interface OrderDetail extends Order {
  is_reviewed?: boolean;
  delivery_address?: string;
  note?: string;
  store: {
    id: number;
    name: string;
    image_url?: string;
    phone_number?: string;
    latitude?: number;
    longitude?: number;
  };
}

export interface OrderGroup {
  groupId: string;
  createdAt: string;
  totalPrice: number;
  orders: Order[];
}

export interface ActiveOrder {
  id: number;
  status: OrderStatus;
  total_price: number;
  store?: { name: string };
  items: OrderItem[];
}

export interface User {
  email: string;
  role: 'admin' | 'store_owner' | 'driver' | 'customer';
  sub: string;
  name?: string;
  id?: number;
  exp?: number;
}

export type DriverStatus = 'offline' | 'online' | 'busy';

export interface DriverLocation {
  latitude: number;
  longitude: number;
  heading?: number; // Direction the car is facing
}

export interface DriverStats {
  today_earnings: number;
  today_orders: number;
  total_orders: number;
  rating: number;
}

// ─── Navigation ─────────────────────────────────────

