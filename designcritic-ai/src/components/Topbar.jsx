import { icon } from "../icons.jsx";

const PAGE_TITLES = {
  home: "Overview",
  upload: "Analyze",
  result: "Analysis",
  compare: "Compare",
  history: "History",
};

export function Topbar({ page, setMobileOpen, aiStatus }) {
  const statusLabel =
    aiStatus === "checking" ? "Checking AI…" : aiStatus === "online" ? "AI ready" : "AI offline";

  return (
    <header className="topbar">
      <button
        className="mobile-menu"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation menu"
      >
        {icon("menu", 20)}
      </button>
      <div className="crumb">{PAGE_TITLES[page] || "DesignCritic AI"}</div>
      <div className="top-actions">
        <span
          className={"status-dot " + (aiStatus === "online" ? "" : "status-dot--off")}
          title={aiStatus === "online" ? "Backend AI service is reachable" : "Backend AI service is unreachable"}
        ></span>
        <span>{statusLabel}</span>
        <button className="avatar top-avatar" type="button" aria-label="Account">
          D
        </button>
      </div>
    </header>
  );
}
