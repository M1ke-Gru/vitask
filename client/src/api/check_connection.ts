import axios from "axios";
import { create } from "zustand";

const checkServerConnection = async (): Promise<boolean> => {
  try {
    await axios.get("/health");
    return true;
  } catch (error) {
    return false;
  }
};

type ConnectionState = {
  isConnected: boolean;
  isReconnecting: boolean;
  waitToReconnect: (onReconnect: () => void) => void;
};

export const useConnection = create<ConnectionState>()((set, get) => ({
  isConnected: true,
  isReconnecting: false,

  waitToReconnect: async (onReconnect) => {
    if (get().isReconnecting) return;

    set({ isReconnecting: true, isConnected: false });

    const interval = setInterval(async () => {
      const ok = await checkServerConnection();
      if (ok) {
        console.warn("Lost connection. Trying to reconnect...");
        clearInterval(interval);
        set({ isConnected: true, isReconnecting: false });
        await onReconnect();
      }
    }, 3000);
  },
}));

