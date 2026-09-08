export function ScoreBar({ label, value, max = 10 }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="score-line">
      <div>
        <span>{label}</span>
        <b>{value}/10</b>
      </div>
      <div className="bar">
        <i style={{ width: pct + "%" }} />
      </div>
    </div>
  );
}
