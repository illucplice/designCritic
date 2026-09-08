import { icon } from "../icons.jsx";
import { demoDesigns } from "../demoData.js";

function HistoryCard({ item, onView, onDelete }) {
  return (
    <div className="history-card">
      <div className="history-thumb">
        <img src={item.image} alt={item.title} />
        <span>{item.analysis.overallScore}</span>
      </div>
      <div className="history-info">
        <div>
          <span className="kicker">{item.designType || "Design"}</span>
          {onDelete && (
            <button onClick={() => onDelete(item.id)} aria-label={`Delete analysis of ${item.title}`} type="button">
              {icon("trash", 15)}
            </button>
          )}
        </div>
        <h3>{item.title}</h3>
        <p>{item.analysis.summary}</p>
        <div className="history-foot">
          <span>{item.isDemo ? "Demo example" : new Date(item.createdAt).toLocaleDateString()}</span>
          <button onClick={() => onView(item)} type="button">
            View analysis {icon("arrow", 14)}
          </button>
        </div>
      </div>
    </div>
  );
}

export function History({ history, setSelected, setPage, deleteHistory }) {
  const hasReal = history.length > 0;
  const view = (item) => {
    setSelected(item);
    setPage("result");
  };

  return (
    <div className="page history-page">
      <div className="page-head">
        <div>
          <span className="kicker">YOUR WORKSPACE</span>
          <h1>Analysis history.</h1>
          <p>Every critique from this session, saved in one place.</p>
        </div>
      </div>

      {hasReal ? (
        <div className="history-grid">
          {history.map((d) => (
            <HistoryCard key={d.id} item={d} onView={view} onDelete={deleteHistory} />
          ))}
        </div>
      ) : (
        <>
          <div className="empty">
            <div>{icon("history", 28)}</div>
            <h2>No analyses yet.</h2>
            <p>Upload your first design and your work will appear here.</p>
          </div>
          <div className="section-heading" style={{ marginTop: 48 }}>
            <div>
              <span className="kicker">IN THE MEANTIME</span>
              <h2>Explore demo examples.</h2>
            </div>
          </div>
          <div className="history-grid">
            {demoDesigns.map((d) => (
              <HistoryCard key={d.id} item={d} onView={view} onDelete={null} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
