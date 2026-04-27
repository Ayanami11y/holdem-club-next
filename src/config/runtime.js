const APP_NAME = 'River Club';
const FRONTEND_PORT = Number(process.env.FRONTEND_PORT || 3000);
const BACKEND_PORT = Number(process.env.PORT || process.env.BACKEND_PORT || 3001);

module.exports = {
  APP_NAME,
  FRONTEND_PORT,
  BACKEND_PORT,
};
