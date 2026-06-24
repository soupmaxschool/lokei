import { createServer } from "rammerhead";

let server;

export default async function handler(req, res) {
  if (!server) {
    server = createServer({
      prefix: "/api/rh/",
      disableCompression: true
    });
  }
  server.emit("request", req, res);
}
