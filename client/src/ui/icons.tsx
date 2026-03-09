export function CheckIcon() {
  return (
    <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
      <path d="M1 6l2.5 3.5L7 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function PlusIcon({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" fill="none">
      <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export function ChevronIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function FilterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M1 2.5h12M3 7h8M5.5 11.5h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}
