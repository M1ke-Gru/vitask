import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  listCategories,
  createCategory,
  deleteCategory as deleteCategoryApi,
  renameCategory as renameCategoryApi,
} from "../api/categories";
import type { CategoryRead } from "../types/category";
import useRequestQueue from "./RequestQueue";

type CategoryListData = {
  categories: CategoryRead[];
  selectedCategoryId: number | null;
  loading: boolean;
  error: string | null;
};

const initialCategoryListData: CategoryListData = {
  categories: [],
  selectedCategoryId: null,
  loading: false,
  error: null,
};

type CategoryListState = CategoryListData & {
  selectCategory: (id: number | null) => void;
  fetchCategories: () => Promise<CategoryRead[]>;
  addCategory: (name: string) => Promise<void>;
  renameCategory: (id: number, name: string) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
  resetOnLogout: () => void;
};

const useCategories = create<CategoryListState>()(
  persist(
    (set, get) => ({
      ...initialCategoryListData,

      selectCategory: (id) => set({ selectedCategoryId: id }),

      fetchCategories: async () => {
        try {
          set({ loading: true, error: null });
          const data = await listCategories();
          set({ categories: data, loading: false });
          const { selectedCategoryId } = get();
          if (
            data.length > 0 &&
            (selectedCategoryId === null || !data.find((c) => c.id === selectedCategoryId))
          ) {
            set({ selectedCategoryId: data[0].id });
          }
          return data;
        } catch (e: any) {
          set({ loading: false });
          throw e;
        }
      },

      addCategory: async (name) => {
        const tempId = -Date.now();
        const optimistic: CategoryRead = { id: tempId, name };
        set((s) => ({
          categories: [...s.categories, optimistic],
          selectedCategoryId: tempId,
          error: null,
        }));
        try {
          const created = await createCategory({ name });
          set((s) => ({
            categories: s.categories.map((c) => (c.id === tempId ? created : c)),
            selectedCategoryId: created.id,
          }));
        } catch (e) {
          useRequestQueue.getState().queueCategoryCreate(optimistic);
          set({ error: e instanceof Error ? e.message : "Offline: queued category creation" });
        }
      },

      renameCategory: async (id, name) => {
        const category = get().categories.find((c) => c.id === id);
        if (!category) return;
        set((s) => ({
          categories: s.categories.map((c) => (c.id === id ? { ...c, name } : c)),
        }));
        try {
          await renameCategoryApi(id, name);
        } catch {
          useRequestQueue.getState().queueCategoryRename({ ...category, name });
        }
      },

      deleteCategory: async (id) => {
        set((s) => {
          const remaining = s.categories.filter((c) => c.id !== id);
          const newSelected =
            s.selectedCategoryId === id ? (remaining[0]?.id ?? null) : s.selectedCategoryId;
          return { categories: remaining, selectedCategoryId: newSelected };
        });
        try {
          await deleteCategoryApi(id);
        } catch {
          useRequestQueue.getState().queueCategoryDelete(id);
        }
      },

      resetOnLogout: () => set({ ...initialCategoryListData }),
    }),
    {
      name: "categories",
      partialize: (s) => ({
        categories: s.categories,
        selectedCategoryId: s.selectedCategoryId,
      }),
      version: 1,
    },
  ),
);

export default useCategories;
