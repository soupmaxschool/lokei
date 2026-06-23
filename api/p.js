export default async function handler(req, res) {
  const target = req.query.url;
  if (!target) return res.status(400).send("Missing ?url=");

  try {
    const base = new URL(target);
    const r = await fetch(target, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    let html = await r.text();

    // Fix relative links: /path → full URL
    html = html.replace(/(href|src)="(\/[^"]*)"/g, (m, attr, path) => {
      const full = base.origin + path;
      return `${attr}="/?u=${encodeURIComponent(full)}"`;
    });

    // Fix absolute links
    html = html.replace(/(href|src)="(https?:\/\/[^"]*)"/g, (m, attr, link) => {
      return `${attr}="/?u=${encodeURIComponent(link)}"`;
    });

    // Remove X-Frame-Options (prevents squishing)
    res.setHeader("X-Frame-Options", "ALLOWALL");
    res.setHeader("Content-Type", "text/html");

    res.send(html);
  } catch (e) {
    res.status(500).send("Proxy error");
  }
}
