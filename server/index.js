import express from "express";
import startup from "./lib/startup.js";
// import api from "./api/index";
import middleware from "./middleware/index.js";
import logger from "./lib/logger.js";
import websockets from './lib/ws.js';

startup()
  .then(async () => {
    const app = express();
    const port = process.env.PORT || 5001;

  middleware(app);
  // api(app);

  const server = app.listen(port, () => {
    if (process.send) {
      process.send(`Server running at http://localhost:${port}\n\n`);
    }
  });

  await websockets(server);

  process.on("message", (message) => {
    console.log(message);
  });
})
.catch((error) => {
  logger.error(error);
});
