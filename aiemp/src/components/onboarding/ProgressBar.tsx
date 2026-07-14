const STEP_LABELS = ['Account', 'Business', 'Phone', 'WhatsApp', 'Configure Aria', 'Calendar', 'Review'];

export default function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <>
      <div className="mb-2.5 flex justify-between font-mono text-[11px] uppercase tracking-wider text-text-faint">
        {STEP_LABELS.map((label, idx) => (
          <span key={label} className={current === idx + 1 ? 'font-semibold text-ink' : ''}>
            {label}
          </span>
        ))}
      </div>
      <div className="mb-[38px] flex gap-1.5">
        {Array.from({ length: total }, (_, i) => i + 1).map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${
              i < current ? 'bg-emerald' : i === current ? 'bg-amber' : 'bg-paper-dim'
            }`}
          />
        ))}
      </div>
    </>
  );
}