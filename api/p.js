export default async function handler(req, res) {
  const target = req.query.url;
  if (!target) return res.status(400).send("Missing ?url=");

  let base;
  try {
    base = new URL(target);
  } catch {
    return res.status(400).send("Bad URL");
  }

  try {
    const r = await fetch(target, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      }
    });

    let html = await r.text();

    // Rewrite relative href/src → full URL via ?u=
    html = html.replace(/(href|src)="(\/[^"]*)"/g, (m, attr, path) => {
      const full = base.origin + path;
      return `${attr}="/?u=${encodeURIComponent(full)}"`;
    });

    // Rewrite absolute href/src → ?u=
    html = html.replace(/(href|src)="(https?:\/\/[^"]*)"/g, (m, attr, link) => {
      return `${attr}="/?u=${encodeURIComponent(link)}"`;
    });

    // Basic JS rewriting: intercept fetch/XMLHttpRequest URLs
    html = html.replace(/fetch\("([^"]+)"\)/g, (m, url) => {
      const full = url.startsWith("http")
        ? url
        : new URL(url, base).toString();
      return `fetch("/api/p.js?url=${encodeURIComponent(full)}")`;
    });

    html = html.replace(/xhr\.open\("GET","([^"]+)"/g, (m, url) => {
      const full = url.startsWith("http")
        ? url
        : new URL(url, base).toString();
      return `xhr.open("GET","/api/p.js?url=${encodeURIComponent(full)}"`;
    });

    res.setHeader("X-Frame-Options", "ALLOWALL");
    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (e) {
    res.status(500).send("Proxy error");
  }
}
