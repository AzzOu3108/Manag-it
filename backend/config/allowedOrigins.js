const allowedOrigins = [
  'http://localhost:3000', //backend itself (same origin fallback)
  'http://localhost:5173', // vite dev server
]

module.exports = allowedOrigins