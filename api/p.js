export default async function handler(req, res) {
  const url = req.query.url;
  if (!url) return res.status(400).send("Missing ?url=");

  try {
    const r = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    let text = await r.text();

    // Rewrite ALL links to go back through the proxy
    text = text.replace(/href="(.*?)"/g, (m, link) => {
      if (link.startsWith("http")) {
        return `href="/?u=${encodeURIComponent(link)}"`;
      }
      return m;
    });

    text = text.replace(/src="(.*?)"/g, (m, link) => {
      if (link.startsWith("http")) {
        return `src="/api/p.js?url=${encodeURIComponent(link)}"`;
      }
      return m;
    });

    res.setHeader("Content-Type", "text/html");
    res.send(text);
  } catch (e) {
    res.status(500).send("Proxy error");
  }
}
