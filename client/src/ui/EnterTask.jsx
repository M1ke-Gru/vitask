export default function EnterTask({ value, onChange }) {
  const style = `
    border-2 rounded-xl border-gray-900 text-blue-50
    focus:outline-none focus:border-gray-500 hover:border-gray-600
    bg-gray-700 px-5 w-full text-2xl focus:ring-0
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
