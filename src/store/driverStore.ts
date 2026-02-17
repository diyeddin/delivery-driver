import { create } from 'zustand';
import { DriverStatus, DriverLocation, Order } from '../types';
import { driverApi } from '../api/drivers';

interface DriverState {
  status: DriverStatus;
  location: DriverLocation | null;
  isConnecting: boolean;
  incomingOrder: Order | null;
  activeOrders: Order[];

  setStatus: (status: DriverStatus) => void;
  setLocation: (location: DriverLocation) => void;
  setConnecting: (loading: boolean) => void;
  setIncomingOrder: (order: Order | null) => void;

  addActiveOrder: (order: Order) => void;
  removeActiveOrder: (orderId: number) => void;
  updateActiveOrder: (order: Order) => void;
  checkForActiveOrders: () => Promise<void>;
}

export const useDriverStore = create<DriverState>((set, get) => ({
  status: 'offline',
  location: null,
  isConnecting: false,
  incomingOrder: null,
  activeOrders: [],

  setStatus: (status) => set({ status }),
  setLocation: (location) => set({ location }),
  setConnecting: (isConnecting) => set({ isConnecting }),
  setIncomingOrder: (order) => set({ incomingOrder: order }),

  addActiveOrder: (order) => {
    const current = get().activeOrders;
    if (current.some(o => o.id === order.id)) return;
    set({ activeOrders: [...current, order] });
  },

  removeActiveOrder: (orderId) => {
    set({
      activeOrders: get().activeOrders.filter(o => o.id !== orderId),
    });
  },

  updateActiveOrder: (order) => {
    set({
      activeOrders: get().activeOrders.map(o =>
        o.id === order.id ? order : o
      ),
    });
  },

  checkForActiveOrders: async () => {
    try {
      const orders = await driverApi.getMyDeliveries();
      const active = orders.filter(o =>
        o.status !== 'delivered' && o.status !== 'canceled'
      );
      if (active.length > 0) {
        set({ activeOrders: active, status: 'online' });
      } else {
        set({ activeOrders: [] });
      }
    } catch (error) {
      console.log("Failed to check active orders", error);
    }
  },
}));
