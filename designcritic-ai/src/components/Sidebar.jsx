import { icon } from "../icons.jsx";

const NAV_ITEMS = [
  ["home", "Overview", "home"],
  ["upload", "Analyze", "upload"],
  ["compare", "Compare", "compare"],
  ["history", "History", "history"],
];

export function Sidebar({ page, setPage, mobileOpen, setMobileOpen }) {
  return (
    <aside className={"sidebar " + (mobileOpen ? "open" : "")}>
      <div className="brand">
        <img className="brand-mark brand-logo" src="/designcritic-logo.png" alt="DesignCritic AI" />
        <div>
          <b>DesignCritic</b>
          <span>AI</span>
        </div>
        <button
          className="mobile-close"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation menu"
        >
          {icon("close", 18)}
        </button>
      </div>
      <div className="nav-label">NAVIGATION</div>
      <nav aria-label="Main navigation">
        {NAV_ITEMS.map(([id, label, ic]) => (
          <button
            key={id}
            className={page === id || (page === "result" && id === "upload") ? "active" : ""}
            aria-current={page === id ? "page" : undefined}
            onClick={() => {
              setPage(id);
              setMobileOpen(false);
            }}
          >
            {icon(ic, 18)}
            {label}
          </button>
        ))}
      </nav>
      <div className="side-bottom">
        <div className="profile">
          <div className="avatar">D</div>
          <div>
            <b>Designer</b>
            <small>Personal workspace</small>
          </div>
        </div>
      </div>
    </aside>
  );
}
