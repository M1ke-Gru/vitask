import type { CategoryCreate, CategoryRead } from "../types/category";
import api from "./auth";

export async function listCategories(): Promise<CategoryRead[]> {
  const { data } = await api.get<Array<CategoryRead>>("/category/list");
  return data;
}

export async function createCategory(
  category: CategoryCreate
): Promise<CategoryRead> {
  const { data } = await api.post<CategoryRead>("/category/create", category);
  return data;
}

export async function renameCategory(id: number, name: string): Promise<CategoryRead> {
  const { data } = await api.patch<CategoryRead>(`/category/name/${id}/${name}`);
  return data;
}

export async function deleteCategory(id: number): Promise<void> {
  await api.delete(`/category/delete/${id}`);
}
