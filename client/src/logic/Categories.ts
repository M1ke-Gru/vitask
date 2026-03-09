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

// Sentinel ID for the local-only default category (before login)
export const LOCAL_CATEGORY_ID = -1;

const LOCAL_UNSORTED: CategoryRead = { id: LOCAL_CATEGORY_ID, name: "Unsorted" };

type CategoryListData = {
  categories: CategoryRead[];
  selectedCategoryId: number | null;
  loading: boolean;
  error: string | null;
};

const initialCategoryListData: CategoryListData = {
  categories: [LOCAL_UNSORTED],
  selectedCategoryId: LOCAL_CATEGORY_ID,
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

          let serverCategories = data;
          let mergeTargetId: number;

          if (data.length === 0) {
            // First login — create the default category on the server using
            // the local one's name (in case the user renamed it before logging in)
            const localDefault = get().categories.find((c) => c.id === LOCAL_CATEGORY_ID);
            const created = await createCategory({ name: localDefault?.name ?? "Unsorted" });
            serverCategories = [created];
            mergeTargetId = created.id;
          } else {
            // Prefer an existing "Unsorted", otherwise use the first category
            mergeTargetId = (data.find((c) => c.name === "Unsorted") ?? data[0]).id;
          }

          // Remap any local tasks / queue jobs that referenced the temp category
          // Import lazily to avoid circular-module issues at init time
          const { default: useTasks } = await import("./Tasks");
          useTasks.getState().remapCategory(LOCAL_CATEGORY_ID, mergeTargetId);
          useRequestQueue.getState().remapTaskCategory(LOCAL_CATEGORY_ID, mergeTargetId);

          const currentId = get().selectedCategoryId;
          const validId = serverCategories.find((c) => c.id === currentId)?.id ?? mergeTargetId;
          set({ categories: serverCategories, loading: false, selectedCategoryId: validId });
          return serverCategories;
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
        if (id < 0) return; // local-only category, no server call
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
        if (id < 0) return; // local-only category, no server call
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
