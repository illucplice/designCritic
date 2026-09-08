import { useMemo, useState } from "react";
import { icon } from "../icons.jsx";
import { demoDesigns } from "../demoData.js";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "../constants.js";

function buildVerdict(a, b) {
  if (Math.abs(a.analysis.overallScore - b.analysis.overallScore) < 0.05) {
    return `${a.title} and ${b.title} score almost identically overall (${a.analysis.overallScore} vs ${b.analysis.overallScore}). Look at the category breakdown below to see where each one actually pulls ahead.`;
  }
  const winner = a.analysis.overallScore > b.analysis.overallScore ? a : b;
  const loser = winner === a ? b : a;

  let biggestGapKey = null;
  let biggestGap = -1;
  for (const key of CATEGORY_ORDER) {
    const gap = Math.abs(winner.analysis.categories[key].score - loser.analysis.categories[key].score);
    if (gap > biggestGap) {
      biggestGap = gap;
      biggestGapKey = key;
    }
  }

  return `${winner.title} wins overall (${winner.analysis.overallScore} vs ${loser.analysis.overallScore}). The biggest gap is in ${CATEGORY_LABELS[biggestGapKey]}, where ${winner.title} scores ${winner.analysis.categories[biggestGapKey].score}/10 against ${loser.analysis.categories[biggestGapKey].score}/10.`;
}

function CompareCard({ design, options, onChange, label }) {
  return (
    <div className="compare-card">
      <div className="compare-label">
        {label}
        <select value={design.id} onChange={(e) => onChange(options.find((x) => x.id === e.target.value))}>
          {options.map((d) => (
            <option key={d.id} value={d.id}>
              {d.title} {d.isDemo ? "(demo)" : ""}
            </option>
          ))}
        </select>
      </div>
      <img src={design.image} alt={design.title} />
      <div className="compare-score">
        <span>Overall</span>
        <b>{design.analysis.overallScore}/10</b>
      </div>
      <div className="compare-bars">
        {CATEGORY_ORDER.map((key) => (
          <div key={key}>
            <span>{CATEGORY_LABELS[key]}</span>
            <i>
              <em style={{ width: design.analysis.categories[key].score * 10 + "%" }} />
            </i>
            <b>{design.analysis.categories[key].score}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Compare({ history }) {
  const pool = useMemo(() => [...history, ...demoDesigns], [history]);
  const [aId, setAId] = useState(pool[0]?.id);
  const [bId, setBId] = useState(pool[1]?.id ?? pool[0]?.id);

  const a = pool.find((d) => d.id === aId) || pool[0];
  const b = pool.find((d) => d.id === bId) || pool[1] || pool[0];

  if (pool.length < 2) {
    return (
      <div className="page compare-page">
        <div className="page-head">
          <div>
            <span className="kicker">COMPARISON MODE</span>
            <h1>A vs. B.</h1>
            <p>Analyze at least two designs to compare them here.</p>
          </div>
        </div>
        <div className="empty">
          <div>{icon("compare", 28)}</div>
          <h2>Nothing to compare yet.</h2>
          <p>Once you've analyzed a couple of designs, they'll show up here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page compare-page">
      <div className="page-head">
        <div>
          <span className="kicker">COMPARISON MODE</span>
          <h1>A vs. B.</h1>
          <p>See which design communicates the message more effectively.</p>
        </div>
      </div>
      {history.length < 2 && (
        <div className="demo-note">
          Showing demo examples until you've analyzed at least two of your own designs.
        </div>
      )}
      <div className="compare-grid">
        <CompareCard design={a} options={pool} onChange={(d) => setAId(d.id)} label="DESIGN A" />
        <CompareCard design={b} options={pool} onChange={(d) => setBId(d.id)} label="DESIGN B" />
      </div>
      <div className="winner">
        <div className="winner-badge">{icon("spark", 18)}</div>
        <div>
          <span className="kicker">DATA-DRIVEN COMPARISON</span>
          <h2>
            {a.analysis.overallScore === b.analysis.overallScore
              ? "It's a tie overall."
              : (a.analysis.overallScore > b.analysis.overallScore ? a.title : b.title) + " wins"}
          </h2>
          <p>{buildVerdict(a, b)}</p>
        </div>
      </div>
    </div>
  );
}
