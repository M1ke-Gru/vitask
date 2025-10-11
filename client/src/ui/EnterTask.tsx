export default function EnterTask({ value, onChange }) {
  const style = `
    border-2 rounded-lg border-gray-600 text-blue-50
    focus:outline-none hover:border-gray-600 focus:bg-gray-700/90
    bg-gray-700/80 px-6 w-full text-2xl focus:ring-0
    placeholder:text-gray-400 placeholder:italic
  `

  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Enter your new task"
      className={style}
    />
  )
}
