import { type ReactNode } from 'react'

interface PageShellProps {
  title: string
  subtitle?: string
  icon?: ReactNode
  children?: ReactNode
}

export default function PageShell({ title, subtitle, icon, children }: PageShellProps) {
  return (
    <div className="section flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
      {icon && (
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary text-white shadow-soft">
          {icon}
        </div>
      )}
      <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{title}</h1>
      {subtitle && <p className="mt-3 max-w-md text-base text-ink/60">{subtitle}</p>}
      {children && <div className="mt-8 w-full max-w-md">{children}</div>}
    </div>
  )
}
