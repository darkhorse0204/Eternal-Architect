import { useEffect, useState } from 'react';

interface HealthRingProps {
  score: number;
  size?: number;
  stroke?: number;
}

function colorForScore(score: number): string {
  if (score > 70) return '#22d3ae';
  if (score > 40) return '#f59e0b';
  return '#f43f5e';
}

export function HealthRing({ score, size = 90, stroke = 8 }: HealthRingProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setProgress(clamped), 50);
    return () => clearTimeout(t);
  }, [clamped]);

  const offset = circumference - (progress / 100) * circumference;
  const color = colorForScore(clamped);

  return (
    <svg width={size} height={size}>
      {/* Rotate only the ring so it starts at 12 o'clock; text stays upright */}
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(148,163,184,0.15)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 1s ease-out, stroke 0.4s ease',
            filter: `drop-shadow(0 0 6px ${color}99)`,
          }}
        />
      </g>
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        className="font-mono font-bold"
        style={{
          fill: color,
          fontSize: size * 0.26,
        }}
      >
        {Math.round(clamped)}
      </text>
    </svg>
  );
}
