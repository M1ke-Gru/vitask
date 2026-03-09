import type { ReactNode } from "react"

// ── Shell ────────────────────────────────────────────────────────────────────

type PopupShellProps = {
  onClose: () => void
  maxWidth?: string
  children: ReactNode
}

export function PopupShell({ onClose, maxWidth = "max-w-sm", children }: PopupShellProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
      <div
        className={`relative animate-fadeInUp w-full ${maxWidth} mx-6 jot-sidebar-bg border jot-border rounded-2xl p-8`}
        style={{ boxShadow: "0 32px 64px rgba(0,0,0,0.5)" }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center jot-text-muted transition-colors"
          style={{ fontSize: "14px" }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "var(--text-primary)")}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "var(--text-muted)")}
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  )
}

// ── Button ───────────────────────────────────────────────────────────────────

type PopupButtonVariant = "ghost" | "accent" | "danger"

type PopupButtonProps = {
  onClick?: () => void
  type?: "button" | "submit"
  variant?: PopupButtonVariant
  children: ReactNode
}

export function PopupButton({ onClick, type = "button", variant = "ghost", children }: PopupButtonProps) {
  const base = "flex-1 py-2.5 rounded-full text-[13px] tracking-wide transition-colors"

  if (variant === "accent") {
    return (
      <button
        type={type}
        onClick={onClick}
        className={`${base} font-medium`}
        style={{ background: "var(--accent)", color: "var(--bg)" }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = "0.85")}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = "1")}
      >
        {children}
      </button>
    )
  }

  if (variant === "danger") {
    return (
      <button
        type={type}
        onClick={onClick}
        className={`${base} border`}
        style={{ borderColor: "#8b4a4a", color: "#c47a7a", background: "transparent" }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "rgba(139,74,74,0.15)")}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "transparent")}
      >
        {children}
      </button>
    )
  }

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${base} jot-text-muted border jot-border`}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "var(--text-secondary)")}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "var(--text-muted)")}
    >
      {children}
    </button>
  )
}
