/**
 * PHASE 1 DEMONSTRATION / MOCK DATA
 * 
 * IMPORTANT: This file contains temporary mock data strictly for Phase 1 frontend layout
 * and interaction verification. It is isolated here and will NOT be used once Supabase
 * persistence and database CRUD are wired in subsequent phases.
 */

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
  createdAt: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  deliveryFee: number;
  isActive: boolean;
  color: string;
  polygonPointsCount: number;
  coverageAreaKm2: number;
  description: string;
}

export type OrderStatus = "pending" | "processing" | "out_for_delivery" | "delivered" | "cancelled";

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  zoneName: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  createdAt: string;
}

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "Artisan Sourdough Loaf",
    description: "Naturally fermented rustic loaf with a crisp crust and chewy crumb.",
    price: 6.50,
    category: "Bakery",
    isAvailable: true,
    createdAt: "2026-10-20T10:00:00Z",
  },
  {
    id: "prod-2",
    name: "Cold Brew Reserve (1L)",
    description: "Slow-steeped Ethiopian single-origin coffee with chocolate and berry notes.",
    price: 12.00,
    category: "Beverages",
    isAvailable: true,
    createdAt: "2026-10-21T09:30:00Z",
  },
  {
    id: "prod-3",
    name: "Organic Hass Avocados (Pack of 4)",
    description: "Farm-fresh ripe avocados grown without synthetic pesticides.",
    price: 7.99,
    category: "Produce",
    isAvailable: true,
    createdAt: "2026-10-22T08:15:00Z",
  },
  {
    id: "prod-4",
    name: "Wildflower Honeycomb (300g)",
    description: "Pure raw honeycomb harvested from high-elevation mountain apiaries.",
    price: 15.50,
    category: "Pantry",
    isAvailable: false,
    createdAt: "2026-10-22T14:45:00Z",
  },
  {
    id: "prod-5",
    name: "Cold-Pressed Olive Oil (500ml)",
    description: "Extra virgin cold-pressed Picholine olive oil from Mediterranean groves.",
    price: 18.00,
    category: "Pantry",
    isAvailable: true,
    createdAt: "2026-10-23T07:20:00Z",
  },
];

export const MOCK_DELIVERY_ZONES: DeliveryZone[] = [
  {
    id: "zone-1",
    name: "Downtown / Central District",
    deliveryFee: 2.50,
    isActive: true,
    color: "#4f46e5",
    polygonPointsCount: 6,
    coverageAreaKm2: 14.8,
    description: "High-density city core with priority 30-minute courier routing.",
  },
  {
    id: "zone-2",
    name: "North Residential Sector",
    deliveryFee: 4.00,
    isActive: true,
    color: "#059669",
    polygonPointsCount: 8,
    coverageAreaKm2: 26.3,
    description: "Suburban northern residential neighborhoods and apartment complexes.",
  },
  {
    id: "zone-3",
    name: "Harbor & Marina Promenade",
    deliveryFee: 5.50,
    isActive: false,
    color: "#d97706",
    polygonPointsCount: 5,
    coverageAreaKm2: 9.1,
    description: "Coastal boardwalk area currently suspended due to road maintenance.",
  },
  {
    id: "zone-4",
    name: "East Innovation Tech Hub",
    deliveryFee: 3.50,
    isActive: true,
    color: "#0284c7",
    polygonPointsCount: 7,
    coverageAreaKm2: 18.2,
    description: "Commercial offices and co-working campuses with scheduled lunch drops.",
  },
];

export const MOCK_ORDERS: Order[] = [
  {
    id: "ord-1",
    orderNumber: "ORD-9482",
    customerName: "Sarah Jenkins",
    customerPhone: "+1 (555) 234-8901",
    deliveryAddress: "452 Pine St, Apt 4B, Central District",
    coordinates: { lat: 33.5898, lng: -7.6038 },
    zoneName: "Downtown / Central District",
    status: "pending",
    items: [
      { productId: "prod-1", productName: "Artisan Sourdough Loaf", quantity: 2, unitPrice: 6.50 },
      { productId: "prod-2", productName: "Cold Brew Reserve (1L)", quantity: 1, unitPrice: 12.00 },
    ],
    subtotal: 25.00,
    deliveryFee: 2.50,
    total: 27.50,
    createdAt: "2026-10-23T13:20:00Z",
  },
  {
    id: "ord-2",
    orderNumber: "ORD-9481",
    customerName: "David Miller",
    customerPhone: "+1 (555) 891-3420",
    deliveryAddress: "812 Evergreen Blvd, North Sector",
    coordinates: { lat: 33.6120, lng: -7.5850 },
    zoneName: "North Residential Sector",
    status: "processing",
    items: [
      { productId: "prod-3", productName: "Organic Hass Avocados (Pack of 4)", quantity: 1, unitPrice: 7.99 },
      { productId: "prod-5", productName: "Cold-Pressed Olive Oil (500ml)", quantity: 1, unitPrice: 18.00 },
    ],
    subtotal: 25.99,
    deliveryFee: 4.00,
    total: 29.99,
    createdAt: "2026-10-23T12:45:00Z",
  },
  {
    id: "ord-3",
    orderNumber: "ORD-9480",
    customerName: "Amira Zahir",
    customerPhone: "+1 (555) 674-1198",
    deliveryAddress: "12 Marina Way, Suite 300",
    coordinates: { lat: 33.6042, lng: -7.6321 },
    zoneName: "East Innovation Tech Hub",
    status: "out_for_delivery",
    items: [
      { productId: "prod-2", productName: "Cold Brew Reserve (1L)", quantity: 3, unitPrice: 12.00 },
    ],
    subtotal: 36.00,
    deliveryFee: 3.50,
    total: 39.50,
    createdAt: "2026-10-23T11:15:00Z",
  },
  {
    id: "ord-4",
    orderNumber: "ORD-9479",
    customerName: "Carlos Santana",
    customerPhone: "+1 (555) 432-9087",
    deliveryAddress: "109 Grand Avenue, Downtown",
    coordinates: { lat: 33.5850, lng: -7.6110 },
    zoneName: "Downtown / Central District",
    status: "delivered",
    items: [
      { productId: "prod-1", productName: "Artisan Sourdough Loaf", quantity: 1, unitPrice: 6.50 },
    ],
    subtotal: 6.50,
    deliveryFee: 2.50,
    total: 9.00,
    createdAt: "2026-10-23T10:05:00Z",
  },
  {
    id: "ord-5",
    orderNumber: "ORD-9478",
    customerName: "Elena Rostova",
    customerPhone: "+1 (555) 345-6712",
    deliveryAddress: "77 Ocean View Rd (Out of Area)",
    coordinates: { lat: 33.6450, lng: -7.7120 },
    zoneName: "Outside Service Area",
    status: "cancelled",
    items: [
      { productId: "prod-5", productName: "Cold-Pressed Olive Oil (500ml)", quantity: 2, unitPrice: 18.00 },
    ],
    subtotal: 36.00,
    deliveryFee: 0.00,
    total: 36.00,
    createdAt: "2026-10-23T09:40:00Z",
  },
];

export const MOCK_DASHBOARD_STATS = {
  totalOrders: 142,
  pendingOrders: 12,
  activeProducts: 24,
  deliveryZones: 4,
  todayRevenue: 2845.50,
};
