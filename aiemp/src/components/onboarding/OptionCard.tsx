export default function OptionCard({
  icon,
  title,
  sub,
  selected,
  onClick,
}: {
  icon: string;
  title: string;
  sub: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-start gap-3 rounded-xl border-[1.5px] p-[18px] text-left transition-colors ${
        selected
          ? 'border-amber bg-amber-soft'
          : 'border-ink/10 bg-transparent hover:bg-ink/[0.03]'
      }`}
    >
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[9px] bg-paper-dim text-[16px]">
        {icon}
      </div>
      <div>
        <div className="text-[14.5px] font-semibold text-ink">{title}</div>
        <div className="mt-[3px] text-[12.5px] text-text-on-paper-dim">{sub}</div>
      </div>
    </button>
  );
}