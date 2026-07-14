export default function ConnectRow({
  icon,
  title,
  sub,
  connected,
  connectedLabel = 'Connected',
  actionLabel = 'Connect',
  onConnect,
}: {
  icon: string;
  title: string;
  sub: string;
  connected: boolean;
  connectedLabel?: string;
  actionLabel?: string;
  onConnect: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-ink/10 py-[18px] last:border-b-0">
      <div className="flex items-center gap-3.5">
        <div className="flex h-[42px] w-[42px] items-center justify-center rounded-[10px] bg-paper-dim text-[19px]">
          {icon}
        </div>
        <div>
          <div className="text-[14.5px] font-semibold text-ink">{title}</div>
          <div className="mt-0.5 text-[12.5px] text-text-on-paper-dim">
            {connected ? connectedLabel : sub}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onConnect}
        className={`rounded-lg px-4 py-[9px] text-[13px] font-semibold transition-colors ${
          connected
            ? 'border-transparent bg-emerald-soft text-emerald'
            : 'border-[1.5px] border-ink bg-transparent text-ink'
        }`}
      >
        {connected ? `✓ ${connectedLabel}` : actionLabel}
      </button>
    </div>
  );
}