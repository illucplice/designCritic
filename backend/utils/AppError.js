// A small typed error so route handlers can throw with an explicit HTTP
// status and a message that is always safe to show to the end user.
export class AppError extends Error {
  constructor(statusCode, publicMessage) {
    super(publicMessage);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.publicMessage = publicMessage;
    this.isAppError = true;
  }
}

// Thrown when the AI's response is malformed or missing required
// categories. Distinct from AppError so designAnalysisService can tell
// "worth retrying" apart from unretryable failures (auth, rate limit,
// bad image) without string-matching messages.
export class IncompleteAnalysisError extends Error {
  constructor(message) {
    super(message);
    this.name = "IncompleteAnalysisError";
    this.isIncompleteAnalysisError = true;
  }
}
