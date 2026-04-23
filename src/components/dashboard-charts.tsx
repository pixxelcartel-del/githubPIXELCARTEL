"use client";

import { cn } from "@/lib/utils";

export function TrendChart({ data }: { data: Array<{ name: string; score: number; order: number }> }) {
  const scorePath = buildLinePath(data.map((item) => item.score), 640, 176, 24);
  const orderPath = buildLinePath(data.map((item) => item.order), 640, 176, 24);

  return (
    <div className="w-full overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4" role="img" aria-label="Mock score and attempt-order trend">
      <svg viewBox="0 0 640 190" className="h-40 w-full">
        <defs>
          <linearGradient id="score-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--green)" stopOpacity="0.26" />
            <stop offset="100%" stopColor="var(--green)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="order-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--cyan)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--cyan)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[25, 50, 75].map((value) => (
          <line
            key={value}
            x1="26"
            x2="614"
            y1={pointY(value, 176, 24)}
            y2={pointY(value, 176, 24)}
            stroke="color-mix(in srgb, var(--ink) 10%, transparent)"
            strokeDasharray="5 9"
          />
        ))}
        <path d={`${scorePath} L 614 176 L 26 176 Z`} fill="url(#score-fill)" />
        <path d={`${orderPath} L 614 176 L 26 176 Z`} fill="url(#order-fill)" />
        <path d={scorePath} fill="none" stroke="var(--green)" strokeLinecap="round" strokeWidth="4" />
        <path d={orderPath} fill="none" stroke="var(--cyan)" strokeLinecap="round" strokeWidth="4" />
        {data.map((item, index) => {
          const x = pointX(index, data.length, 640, 24);
          return (
            <g key={item.name}>
              <circle cx={x} cy={pointY(item.score, 176, 24)} r="5" fill="var(--green)" />
              <circle cx={x} cy={pointY(item.order, 176, 24)} r="5" fill="var(--cyan)" />
            </g>
          );
        })}
      </svg>
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-bold text-muted">
        <span><span className="mr-2 inline-block h-2 w-5 rounded-full bg-[var(--green)]" />Score</span>
        <span><span className="mr-2 inline-block h-2 w-5 rounded-full bg-[var(--cyan)]" />Attempt order</span>
      </div>
    </div>
  );
}

export function SkillChart({ data }: { data: Array<{ topic?: string; skill: string; score: number; awarded?: number; max?: number }> }) {
  const chartData = [...data]
    .sort((a, b) => a.score - b.score)
    .slice(0, 8);

  return (
    <div className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-3" role="img" aria-label="Subject topic mastery priorities">
      <div className="grid gap-2">
        {chartData.map((item, index) => {
          const score = Math.max(0, Math.min(100, item.score));
          const tone = score < 45 ? "var(--rose)" : score < 75 ? "var(--gold)" : "var(--green)";

          return (
            <div key={`${item.topic ?? "topic"}-${item.skill}-${index}`} className="grid gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 sm:grid-cols-[150px_1fr_62px] sm:items-center">
              <div className="min-w-0">
                <p className="truncate text-[11px] font-black uppercase tracking-normal text-muted">{item.topic ?? "Physics"}</p>
                <p className="truncate text-sm font-black text-ink">{item.skill}</p>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--ink)_9%,transparent)]">
                <div
                  className={cn("h-full rounded-full transition-all", score >= 75 && "shadow-[0_0_18px_rgba(24,193,125,0.28)]", score < 45 && "shadow-[0_0_18px_rgba(242,64,110,0.22)]")}
                  style={{ width: `${score}%`, backgroundColor: tone }}
                />
              </div>
              <div className="font-mono text-sm font-black text-ink">
                {typeof item.awarded === "number" && typeof item.max === "number" ? `${item.awarded}/${item.max}` : `${score}%`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function buildLinePath(values: number[], width: number, height: number, padding: number) {
  return values.map((value, index) => {
    const command = index === 0 ? "M" : "L";
    return `${command} ${pointX(index, values.length, width, padding)} ${pointY(value, height, padding)}`;
  }).join(" ");
}

function pointX(index: number, count: number, width: number, padding: number) {
  if (count <= 1) {
    return width / 2;
  }

  return padding + 2 + (index / (count - 1)) * (width - padding * 2 - 4);
}

function pointY(value: number, height: number, padding: number) {
  return padding + (100 - Math.max(0, Math.min(100, value))) / 100 * (height - padding);
}
