export default async function handler(req, res) {
  let url = req.query.url;
  if (!url) return res.status(400).send("Missing url");

  let maxRedirects = 10;

  try {
    for (let i = 0; i < maxRedirects; i++) {
      const response = await fetch(url, {
        redirect: "manual",
        headers: {
          "User-Agent": req.headers["user-agent"] || "Mozilla/5.0",
          "Accept": "*/*",
          "Accept-Language": "en-US,en;q=0.9"
        }
      });

      // Handle redirects
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) break;
        url = new URL(location, url).href;
        continue;
      }

      // Copy headers safely
      const contentType = response.headers.get("content-type") || "text/html";
      res.setHeader("content-type", contentType);

      // Allow browser to display it
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "*");

      // Binary-safe body
      const buffer = Buffer.from(await response.arrayBuffer());

      res.status(response.status).send(buffer);
      return;
    }

    res.status(500).send("Too many redirects");
  } catch (err) {
    res.status(500).send("Proxy error: " + err.message);
  }
}
