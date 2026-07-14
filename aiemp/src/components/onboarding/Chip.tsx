export default function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border-[1.5px] px-4 py-2.5 text-[13.5px] font-semibold transition-colors ${
        selected
          ? 'border-emerald bg-emerald-soft text-emerald'
          : 'border-ink/10 text-text-on-paper-dim'
      }`}
    >
      {label}
    </button>
  );
}