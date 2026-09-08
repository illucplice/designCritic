import { useState } from "react";
import { icon } from "../icons.jsx";
import { ScoreBar } from "../components/ScoreBar.jsx";
import { CATEGORY_LABELS, CATEGORY_ORDER, PRIORITY_ORDER } from "../constants.js";

function downloadReport(record) {
  const a = record.analysis;
  const lines = [
    `DesignCritic AI — Analysis Report`,
    `Title: ${record.title}`,
    `Design type: ${record.designType || "Not specified"}`,
    `Mode: ${record.mode}`,
    `Date: ${new Date(record.createdAt).toLocaleString()}`,
    record.isDemo ? `(This is a demo example, not a real AI analysis of an uploaded design.)` : "",
    ``,
    `OVERALL SCORE: ${a.overallScore}/10`,
    a.summary,
    a.roast ? `\n--- ROAST ---\n${a.roast}` : "",
    ``,
    `--- CATEGORY SCORES ---`,
    ...CATEGORY_ORDER.map((k) => `${CATEGORY_LABELS[k]}: ${a.categories[k]?.score ?? "-"}/10`),
    ``,
    `--- WHAT WORKS ---`,
    ...a.whatWorks.map((s) => `• ${s}`),
    ``,
    `--- NEEDS IMPROVEMENT ---`,
    ...a.needsImprovement.map((s) => `• ${s}`),
    ``,
    `--- FIX THESE FIRST ---`,
    ...a.priorityFixes.map(
      (f) => `[${f.priority}] ${f.problem}\n  Why it matters: ${f.why}\n  Recommendation: ${f.recommendation}`
    ),
    ``,
    `--- FINAL VERDICT ---`,
    a.finalVerdict,
  ].filter((l) => l !== "");

  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${record.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-critique.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function Result({ current, saved, setSaved, setPage, onReplaceImage }) {
  const [open, setOpen] = useState(CATEGORY_ORDER[0]);
  const a = current.analysis;
  const sortedFixes = [...(a.priorityFixes || [])].sort(
    (x, y) => (PRIORITY_ORDER[x.priority] ?? 3) - (PRIORITY_ORDER[y.priority] ?? 3)
  );

  return (
    <div className="page result-page">
      <div className="result-head">
        <div>
          <button className="back" onClick={() => setPage("upload")}>
            ← Analyze another
          </button>
          <h1>{current.title}</h1>
          <p>
            {current.designType || "Design"} · {current.mode} mode ·{" "}
            {current.isDemo ? "Demo example" : `Analyzed ${new Date(current.createdAt).toLocaleString()}`}
          </p>
        </div>
        <div className="result-actions">
          <button
            className={saved ? "icon-btn saved" : "icon-btn"}
            onClick={() => setSaved(!saved)}
            type="button"
          >
            {icon("bookmark", 17)} {saved ? "Saved" : "Save"}
          </button>
          <button className="icon-btn" onClick={() => downloadReport(current)} type="button">
            {icon("download", 17)} Report
          </button>
        </div>
      </div>

      {current.isDemo && (
        <div className="demo-note">
          This is a fixed demo example so you can see the report format — it isn't a live AI analysis.
        </div>
      )}

      {current.analysis?.roast && (
        <section className="verdict-section" style={{marginBottom:"22px"}}>
          <span className="kicker">🔥 ROAST MY DESIGN</span>
          <p>{current.analysis.roast}</p>
        </section>
      )}

      <div className="result-grid">
        <div className="result-left">
          <div className="design-preview">
            <img src={current.image} alt={`Analyzed design: ${current.title}`} />
            <div className="preview-corner">ANALYZED DESIGN</div>
          </div>
          <div className="insight-card">
            <div className="insight-icon">{icon("spark", 17)}</div>
            <div>
              <span className="kicker">ART DIRECTOR NOTE</span>
              <p>{a.summary}</p>
            </div>
          </div>
          {a.elements?.detected?.length > 0 && (
            <div className="elements-card">
              <span className="kicker">ELEMENTS DETECTED</span>
              <div className="chips">
                {a.elements.detected.map((el) => (
                  <span key={el}>{el}</span>
                ))}
              </div>
              {a.elements.notes && <p className="muted-note">{a.elements.notes}</p>}
            </div>
          )}
        </div>
        <div className="result-right">
          <div className="overall-card">
            <div>
              <span className="kicker">OVERALL SCORE</span>
              <div className="big-score">
                {a.overallScore}
                <small>/10</small>
              </div>
              <p>Weighted average across all 9 critique dimensions.</p>
            </div>
            <div className="big-ring">
              <span>{Math.round(a.overallScore * 10)}</span>
              <small>/100</small>
            </div>
          </div>
          <div className="score-card">
            <div className="card-title">
              <span>Design scorecard</span>
              <span className="muted">9 dimensions</span>
            </div>
            {CATEGORY_ORDER.map((key) => (
              <ScoreBar key={key} label={CATEGORY_LABELS[key]} value={a.categories[key]?.score ?? 0} />
            ))}
          </div>
        </div>
      </div>

      {sortedFixes.length > 0 && (
        <section className="fixes-section">
          <div className="section-heading">
            <div>
              <span className="kicker">FIX THESE FIRST</span>
              <h2>Where to focus your next revision.</h2>
            </div>
          </div>
          <div className="fixes-grid">
            {sortedFixes.map((f, i) => (
              <div className={"fix-card fix-" + f.priority.toLowerCase()} key={i}>
                <span className={"priority-badge priority-" + f.priority.toLowerCase()}>
                  {f.priority} priority
                </span>
                <h3>{f.problem}</h3>
                {f.why && (
                  <p>
                    <b>Why it matters: </b>
                    {f.why}
                  </p>
                )}
                {f.recommendation && (
                  <p>
                    <b>Recommendation: </b>
                    {f.recommendation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="critique-section">
        <div className="section-heading">
          <div>
            <span className="kicker">THE CRITIQUE</span>
            <h2>What the art director sees.</h2>
          </div>
          <span className="mode-pill">{current.mode} review</span>
        </div>
        <div className="critique-grid critique-grid-2">
          <div className="critique-card good">
            <div className="critique-top">
              <span className="critique-dot"></span>
              <h3>What's working</h3>
            </div>
            {a.whatWorks.length ? (
              <ul>
                {a.whatWorks.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            ) : (
              <p className="muted-note">No specific strengths were confidently identified.</p>
            )}
          </div>
          <div className="critique-card bad">
            <div className="critique-top">
              <span className="critique-dot"></span>
              <h3>What needs improvement</h3>
            </div>
            {a.needsImprovement.length ? (
              <ul>
                {a.needsImprovement.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            ) : (
              <p className="muted-note">No significant issues were identified.</p>
            )}
          </div>
        </div>
      </section>

      <section className="breakdown">
        <div className="section-heading">
          <div>
            <span className="kicker">DEEP DIVE</span>
            <h2>Design breakdown.</h2>
          </div>
        </div>
        <div className="accordion">
          {CATEGORY_ORDER.map((key) => {
            const c = a.categories[key];
            const label = CATEGORY_LABELS[key];
            const isOpen = open === key;
            return (
              <div className={"accordion-item " + (isOpen ? "open" : "")} key={key}>
                <button onClick={() => setOpen(isOpen ? "" : key)} aria-expanded={isOpen}>
                  <span>
                    <b>{label}</b>
                    <small>{c.score}/10</small>
                  </span>
                  {icon("chevron", 18)}
                </button>
                {isOpen && (
                  <div className="accordion-body">
                    {c.strengths.length > 0 && (
                      <div className="accordion-block">
                        <b className="accordion-block-label good">Strengths</b>
                        <ul>
                          {c.strengths.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {c.issues.length > 0 && (
                      <div className="accordion-block">
                        <b className="accordion-block-label bad">Issues</b>
                        <ul>
                          {c.issues.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {c.recommendations.length > 0 && (
                      <div className="accordion-block">
                        <b className="accordion-block-label fix">Recommendations</b>
                        <ul>
                          {c.recommendations.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {c.strengths.length === 0 && c.issues.length === 0 && c.recommendations.length === 0 && (
                      <p className="muted-note">No specific notes for this category.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {a.finalVerdict && (
        <section className="verdict-section">
          <span className="kicker">FINAL VERDICT</span>
          <p>{a.finalVerdict}</p>
        </section>
      )}
    </div>
  );
}
