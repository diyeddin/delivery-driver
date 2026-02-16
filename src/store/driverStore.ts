import { create } from 'zustand';
import { DriverStatus, DriverLocation, Order, OrderStatus } from '../types';
import { driverApi } from '../api/drivers'; // Import the API

interface DriverState {
  status: DriverStatus;
  location: DriverLocation | null;
  isConnecting: boolean;
  incomingOrder: Order | null;
  activeOrder: Order | null;
  
  setStatus: (status: DriverStatus) => void;
  setLocation: (location: DriverLocation) => void;
  setConnecting: (loading: boolean) => void;
  setIncomingOrder: (order: Order | null) => void;
  setActiveOrder: (order: Order | null) => void;
  
  // 👇 NEW ACTION
  checkForActiveOrder: () => Promise<void>;
}

export const useDriverStore = create<DriverState>((set, get) => ({
  status: 'offline',
  location: null,
  isConnecting: false,
  incomingOrder: null,
  activeOrder: null,

  setStatus: (status) => set({ status }),
  setLocation: (location) => set({ location }),
  setConnecting: (isConnecting) => set({ isConnecting }),
  setIncomingOrder: (order) => set({ incomingOrder: order }),
  setActiveOrder: (order) => set({ activeOrder: order }),

  // 👇 The Logic to Resume Orders
  checkForActiveOrder: async () => {
    try {
      const orders = await driverApi.getMyDeliveries();
      
      // Find an order that is NOT delivered and NOT canceled
      const active = orders.find(o => 
        o.status !== 'delivered' && 
        o.status !== 'canceled'
      );

      if (active) {
        set({ activeOrder: active, status: 'busy' });
        console.log("🔄 Resumed Active Order:", active.id);
      } else {
        set({ activeOrder: null });
      }
    } catch (error) {
      console.log("Failed to check active orders", error);
    }
  }
}));