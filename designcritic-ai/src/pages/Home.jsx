import { icon } from "../icons.jsx";
import { demoDesigns } from "../demoData.js";
import { ScoreBar } from "../components/ScoreBar.jsx";
import { CATEGORY_LABELS } from "../constants.js";

const FEATURES = [
  ["spark", "Visual Hierarchy", "Finds what gets attention first — and whether it should."],
  ["compare", "Composition", "Reads alignment, balance, negative space and visual flow."],
  ["spark", "Typography", "Reviews type scale, pairing, weight, line-height and readability."],
  ["spark", "Color & Contrast", "Checks harmony, contrast and whether color supports the message."],
  ["spark", "Branding", "Looks for consistency, logo placement and brand presence."],
  ["spark", "AI Recommendations", "Turns every weakness into a concrete next step."],
];

export function Home({ setPage, setSelected }) {
  const demo = demoDesigns[0];
  const previewCategories = ["visualHierarchy", "composition", "typography", "color"];

  return (
    <div className="page home-page">
      <section className="hero">
        <div className="eyebrow">
          <span className="pulse"></span> AI ART DIRECTION FOR EVERY DESIGN
        </div>
        <h1>
          Your design.
          <br />
          <em>Critiqued by AI.</em>
        </h1>
        <p>
          Get senior-level feedback on hierarchy, typography, color, spacing, composition,
          branding, and visual impact — grounded in what's actually in your image.
        </p>
        <div className="hero-actions">
          <button className="primary" onClick={() => setPage("upload")}>
            Analyze a design {icon("arrow", 17)}
          </button>
          <button
            className="ghost"
            onClick={() => {
              setSelected(demo);
              setPage("result");
            }}
          >
            Explore a demo critique
          </button>
        </div>
        <div className="trust">
          <div className="mini-avatars">
            <i>D</i>
            <i>A</i>
            <i>+</i>
          </div>
          <span>Built for designers who care about the details.</span>
        </div>
      </section>

      <section className="demo-strip">
        <div className="section-heading">
          <div>
            <span className="kicker">DEMO EXAMPLE</span>
            <h2>See how a real critique looks.</h2>
          </div>
          <span className="muted">Sample analysis, not your data</span>
        </div>
        <div className="preview-grid">
          <div className="preview-image">
            <img src={demo.image} alt="Sample uploaded design used for the demo critique" />
            <div className="image-tag">DEMO PREVIEW</div>
          </div>
          <div className="preview-analysis">
            <div className="score-row">
              <div>
                <span className="kicker">OVERALL</span>
                <strong>
                  {demo.analysis.overallScore}
                  <span>/10</span>
                </strong>
              </div>
              <div className="score-ring">
                <div>{Math.round(demo.analysis.overallScore * 10)}</div>
              </div>
            </div>
            <div className="bars">
              {previewCategories.map((key) => (
                <ScoreBar key={key} label={CATEGORY_LABELS[key]} value={demo.analysis.categories[key].score} />
              ))}
            </div>
            <div className="micro-note">
              <span>{icon("spark", 14)}</span>
              <div>
                <b>AI insight</b>
                <p>{demo.analysis.summary}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="section-heading">
          <div>
            <span className="kicker">WHAT WE LOOK AT</span>
            <h2>More than a score.</h2>
          </div>
        </div>
        <div className="feature-grid">
          {FEATURES.map(([ic, t, d]) => (
            <div className="feature" key={t}>
              <div className="feature-icon">{icon(ic, 18)}</div>
              <h3>{t}</h3>
              <p>{d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
