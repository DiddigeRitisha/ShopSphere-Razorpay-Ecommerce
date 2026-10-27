export function notFound(req, res) { res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` }); }
export function errorHandler(err, req, res, next) {
  console.error(err);
  if (err?.name === 'ValidationError') return res.status(400).json({ message: 'Invalid data.', details: err.message });
  if (err?.code === 11000) return res.status(409).json({ message: 'That value is already in use.' });
  const status = err.status || 500;
  res.status(status).json({ message: status === 500 && process.env.NODE_ENV === 'production' ? 'Unexpected server error.' : (err.message || 'Server error.') });
}
