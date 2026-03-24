function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    error: statusCode >= 500 ? "Internal Server Error" : "Request Error",
    message: err.message || "Unexpected server error.",
    details: err.details || null,
  });
}

module.exports = errorHandler;
