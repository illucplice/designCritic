// Central error handler. Every route funnels errors here via next(err),
// which guarantees a consistent, safe JSON shape and keeps stack traces,
// API keys, and other internals out of the response.
export function errorHandler(err, req, res, _next) {
  const isAppError = err && err.isAppError;
  const statusCode = isAppError ? err.statusCode : 500;

  // Log full detail server-side only.
  if (statusCode >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl}:`, err);
  } else {
    console.warn(`[warn] ${req.method} ${req.originalUrl}: ${err.message}`);
  }

  const message = isAppError
    ? err.publicMessage
    : "Something went wrong on our end. Please try again in a moment.";

  res.status(statusCode).json({
    error: true,
    message,
  });
}

export function notFoundHandler(req, res) {
  res.status(404).json({ error: true, message: "Not found." });
}
