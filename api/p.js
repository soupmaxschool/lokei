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

      // Handle redirects manually
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) break;

        // Resolve relative redirects
        url = new URL(location, url).href;
        continue;
      }

      // Copy content-type
      const contentType = response.headers.get("content-type") || "text/html";
      res.setHeader("content-type", contentType);

      // CORS so browser doesn't block it
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "*");

      // Copy other headers safely
      response.headers.forEach((value, key) => {
        if (key.toLowerCase() === "content-type") return;
        try { res.setHeader(key, value); } catch {}
      });

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
