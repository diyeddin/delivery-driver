import client from './client';
import { Order, OrderStatus } from '../types';

export const driverApi = {
  // 1. Get all my deliveries (Active + History)
  getMyDeliveries: async (): Promise<Order[]> => {
    const res = await client.get('/drivers/my-deliveries');
    return res.data;
  },

  // 2. Accept an order (returns full Order with store/items)
  acceptOrder: async (orderId: number): Promise<Order> => {
    const res = await client.post(`/drivers/accept-order/${orderId}`);
    return res.data;
  },

  // 3. Update status (returns full updated Order)
  updateStatus: async (orderId: number, newStatus: string): Promise<Order> => {
    const res = await client.patch(`/drivers/delivery-status/${orderId}`, {
      new_status: newStatus,
    });
    return res.data;
  },

  // 4. Get History (Optional, if you want pagination later)
  getHistory: async (limit = 20): Promise<Order[]> => {
    const res = await client.get(`/drivers/history?limit=${limit}`);
    return res.data;
  }
};