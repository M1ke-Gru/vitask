import useCategories from "../logic/Categories"
import Category from "./Category"

export default function Main() {
  const catVM = useCategories()
  const selected = catVM.categories.find((c) => c.id === catVM.selectedCategoryId)

  return (
    <>
      {selected && <Category categoryId={selected.id} name={selected.name} />}
    </>
  )
}
