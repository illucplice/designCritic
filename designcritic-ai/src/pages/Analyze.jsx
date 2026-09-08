import { icon } from "../icons.jsx";
import { ErrorBanner } from "../components/ErrorBanner.jsx";
import { DESIGN_TYPES, LOADING_MESSAGES } from "../constants.js";

export function Analyze({
  image,
  drag,
  setDrag,
  fileRef,
  onFileSelected,
  onRemoveImage,
  maxFileSizeMb,
  mode,
  setMode,
  designType,
  setDesignType,
  audience,
  setAudience,
  platform,
  setPlatform,
  goal,
  setGoal,
  onAnalyze,
  loading,
  loadingStep,
  uploadError,
  clearUploadError,
}) {
  return (
    <div className="page analyze-page">
      <div className="page-head">
        <div>
          <span className="kicker">NEW ANALYSIS</span>
          <h1>Give your design a second opinion.</h1>
          <p>Upload a visual and let an AI art director break it down.</p>
        </div>
      </div>

      <ErrorBanner message={uploadError} onDismiss={clearUploadError} />

      <div className="analyze-layout">
        <div className="upload-card">
          <div
            className={"dropzone " + (drag ? "drag" : "") + (loading ? " disabled" : "")}
            onDragOver={(e) => {
              e.preventDefault();
              if (!loading) setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              if (!loading) onFileSelected(e.dataTransfer.files?.[0]);
            }}
            onClick={() => !loading && fileRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label={image ? "Replace uploaded design" : "Upload a design image"}
            onKeyDown={(e) => {
              if (!loading && (e.key === "Enter" || e.key === " ")) fileRef.current?.click();
            }}
          >
            {image ? (
              <>
                <img src={image} alt="Uploaded design preview" />
                <div className="replace">
                  <span>{icon("upload", 17)}</span>
                  Replace image
                </div>
              </>
            ) : (
              <>
                <div className="upload-icon">{icon("upload", 28)}</div>
                <h3>Drop your design here</h3>
                <p>or click to browse · JPG, PNG, WEBP</p>
                <span className="upload-limit">Up to {maxFileSizeMb}MB</span>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              hidden
              disabled={loading}
              onChange={(e) => onFileSelected(e.target.files?.[0])}
            />
          </div>
          {image && (
            <button className="remove-btn" onClick={onRemoveImage} disabled={loading} type="button">
              {icon("close", 15)} Remove image
            </button>
          )}
        </div>

        <div className="settings-card">
          <div className="card-title">
            <span>Analysis settings</span>
            <span className="help" title="Choose how detailed and how direct the feedback should be.">
              {icon("info", 15)}
            </span>
          </div>
          <label htmlFor="mode-tabs">MODE</label>
          <div className="mode-tabs" id="mode-tabs" role="radiogroup" aria-label="Critique mode">
            {["Quick", "Professional", "Roast"].map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={mode === m}
                className={mode === m ? "selected" : ""}
                onClick={() => setMode(m)}
                disabled={loading}
              >
                {m}
                {m === "Roast" && <span>🔥</span>}
              </button>
            ))}
          </div>

          <label htmlFor="design-type">DESIGN TYPE</label>
          <select
            id="design-type"
            value={designType}
            onChange={(e) => setDesignType(e.target.value)}
            disabled={loading}
          >
            {DESIGN_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <label htmlFor="audience">
            TARGET AUDIENCE <span>optional</span>
          </label>
          <input
            id="audience"
            placeholder="e.g. young professionals"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            disabled={loading}
          />

          <label htmlFor="platform">
            PLATFORM <span>optional</span>
          </label>
          <input
            id="platform"
            placeholder="e.g. Instagram, print, web"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            disabled={loading}
          />

          <label htmlFor="goal">
            WHAT SHOULD IT ACHIEVE? <span>optional</span>
          </label>
          <textarea
            id="goal"
            placeholder="Describe the message or goal..."
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            disabled={loading}
          ></textarea>

          <button className="primary full" onClick={onAnalyze} disabled={loading} type="button">
            {loading ? (
              <>
                <span className="spinner"></span>
                {LOADING_MESSAGES[loadingStep] || "Analyzing design..."}
              </>
            ) : (
              <>Analyze Design {icon("arrow", 16)}</>
            )}
          </button>
          <p className="privacy">Your image is sent only to the analysis backend for this request.</p>
        </div>
      </div>

      <div className="analysis-steps" aria-hidden="true">
        {["Composition", "Typography", "Color", "Hierarchy", "Recommendations"].map((label, i) => (
          <span key={label} className={loading && loadingStep >= i + 1 ? "step-done" : ""}>
            {String(i + 1).padStart(2, "0")} · {label}
          </span>
        ))}
      </div>
    </div>
  );
}
