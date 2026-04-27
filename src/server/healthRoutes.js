const APP_NAME = 'River Club';

function registerHealthRoutes(app, options) {
  const getPort = options.getPort;
  const getRoomCount = options.getRoomCount;

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      app: APP_NAME,
      port: getPort(),
      rooms: getRoomCount(),
    });
  });
}

module.exports = { APP_NAME, registerHealthRoutes };
