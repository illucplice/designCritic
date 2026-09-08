import { icon } from "../icons.jsx";

export function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="error-banner" role="alert">
      <span className="error-banner-icon">{icon("alert", 17)}</span>
      <p>{message}</p>
      {onDismiss && (
        <button className="error-banner-close" onClick={onDismiss} aria-label="Dismiss error">
          {icon("close", 14)}
        </button>
      )}
    </div>
  );
}
