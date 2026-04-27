const express = require('express');
const path = require('path');

function createApp() {
  const app = express();
  const clientPath = path.join(__dirname, '..', 'client');

  app.use('/', express.static(clientPath));

  return app;
}

module.exports = { createApp };
