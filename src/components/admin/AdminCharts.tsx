import { useState } from 'react'
import type { ChartDataPoint } from '../../lib/adminService'

export function LineTrendChart({ data }: { data: ChartDataPoint[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  if (!data || data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-xs font-medium text-ink/40">
        No trend data available
      </div>
    )
  }

  const maxValue = Math.max(...data.map((d) => d.value), 4)
  const height = 150
  const width = 500
  const paddingX = 28
  const paddingTop = 20
  const paddingBottom = 28

  const points = data.map((d, index) => {
    const x = paddingX + (index / (data.length - 1 || 1)) * (width - paddingX * 2)
    const y = paddingTop + (1 - d.value / maxValue) * (height - paddingTop - paddingBottom)
    return { x, y, value: d.value, label: d.label }
  })

  const pathD = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`
    return `${acc} L ${p.x} ${p.y}`
  }, '')

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`

  return (
    <div className="w-full">
      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 overflow-visible">
          <defs>
            <linearGradient id="trendAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.5, 1].map((ratio) => {
            const y = paddingTop + (1 - ratio) * (height - paddingTop - paddingBottom)
            return (
              <line
                key={ratio}
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="#EDE9FE"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
            )
          })}

          {/* Shaded Area */}
          <path d={areaD} fill="url(#trendAreaGradient)" />

          {/* Stroke Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#7C3AED"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points and tooltips */}
          {points.map((p, i) => {
            const isHovered = hoveredIdx === i
            return (
              <g
                key={i}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                {/* Invisible hover target */}
                <circle cx={p.x} cy={p.y} r="14" fill="transparent" />

                {/* Visible dot */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 6 : 4}
                  fill="#FFFFFF"
                  stroke="#7C3AED"
                  strokeWidth="2.5"
                  className="transition-all duration-150"
                />

                {/* Floating tooltip badge */}
                {isHovered && (
                  <g>
                    <rect
                      x={p.x - 22}
                      y={p.y - 30}
                      width="44"
                      height="20"
                      rx="6"
                      fill="#1E1B4B"
                    />
                    <text
                      x={p.x}
                      y={p.y - 16}
                      textAnchor="middle"
                      className="text-[10px] font-bold fill-white tabular-nums"
                    >
                      {p.value} reqs
                    </text>
                  </g>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* X-axis labels */}
      <div className="mt-1 flex justify-between px-2 text-[11px] font-medium text-ink/50 tabular-nums">
        {data.map((d, i) => (
          <span key={i} className="truncate">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export function CategoryBarChart({ data }: { data: ChartDataPoint[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-xs font-medium text-ink/40">
        No category demand recorded yet
      </div>
    )
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1)

  return (
    <div className="space-y-3 pt-1">
      {data.map((item, idx) => {
        const percentage = Math.round((item.value / maxValue) * 100)
        return (
          <div key={idx} className="space-y-1">
            <div className="flex items-center justify-between text-xs font-medium text-ink">
              <span className="truncate">{item.label}</span>
              <span className="tabular-nums font-semibold text-ink/70">
                {item.value} {item.value === 1 ? 'request' : 'requests'}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.max(percentage, 5)}%`,
                  backgroundColor: item.color || '#7C3AED',
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function DonutChart({
  data,
  totalLabel = 'Total',
}: {
  data: ChartDataPoint[]
  totalLabel?: string
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0)

  if (total === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-xs font-medium text-ink/40">
        No distribution records available
      </div>
    )
  }

  let accumulatedAngle = 0
  const size = 140
  const center = size / 2
  const radius = 50
  const strokeWidth = 16

  const slices = data
    .filter((d) => d.value > 0)
    .map((d) => {
      const angle = (d.value / total) * 360
      const startAngle = accumulatedAngle
      accumulatedAngle += angle

      const circumference = 2 * Math.PI * radius
      const strokeDasharray = `${(angle / 360) * circumference} ${circumference}`
      const strokeDashoffset = -((startAngle / 360) * circumference)

      return {
        ...d,
        strokeDasharray,
        strokeDashoffset,
        percentage: Math.round((d.value / total) * 100),
      }
    })

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
      {/* SVG Donut */}
      <div className="relative flex h-32 w-32 shrink-0 items-center justify-center">
        <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#F1F5F9"
            strokeWidth={strokeWidth}
          />
          {slices.map((s, idx) => (
            <circle
              key={idx}
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke={s.color || '#7C3AED'}
              strokeWidth={strokeWidth}
              strokeDasharray={s.strokeDasharray}
              strokeDashoffset={s.strokeDashoffset}
              strokeLinecap="butt"
              className="transition-all duration-500"
            />
          ))}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-black tabular-nums tracking-tight text-ink">{total}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-ink/45">
            {totalLabel}
          </span>
        </div>
      </div>

      {/* Legend Grid */}
      <div className="grid grid-cols-1 gap-1.5 text-xs">
        {slices.map((s, idx) => (
          <div key={idx} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: s.color || '#7C3AED' }}
              />
              <span className="truncate font-medium text-ink/75">{s.label}</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold tabular-nums text-ink shrink-0">
              <span>{s.value}</span>
              <span className="text-[10px] font-normal text-ink/40">({s.percentage}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
