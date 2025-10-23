import axios from "axios"
import { create } from "zustand"
import { persist } from "zustand/middleware"

const connected = async (): Promise<boolean> => {
  try {
    await axios.get("/")
  } catch (error) {
    if (error) {
      return false
    }
  }
  return true
}

async function connectivityHelper(onReconnect: () => void): Promise<void> {
  return new Promise(resolve => {
    const check = async () => {
      const connection = await connected();
      if (connection) {
        onReconnect();
        resolve();
      } else {
        setTimeout(check, 2000); // Продовжуємо опитування
      }
    };
    check();
  });
}

type connectionState = {
  helperRunning: boolean,
  waitToReconnect: (onReconnect: () => void) => void
}

export const connection = create<connectionState>()(
  (set, get) => ({
    helperRunning: false,
    waitToReconnect: async (onReconnect) => {
      if (!get().helperRunning) {
        set({ helperRunning: true })
        await connectivityHelper(onReconnect)
        set({ helperRunning: false })
      }
    }
  }),
)
