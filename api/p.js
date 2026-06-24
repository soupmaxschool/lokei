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
        "Accept": "*/*"
      }
    });

    let html = await r.text();

    // Remove CSP (DuckDuckGo blocks everything otherwise)
    html = html.replace(/<meta[^>]*content-security-policy[^>]*>/gi, "");
    html = html.replace(/Content-Security-Policy[^:]*:[^;"]*/gi, "");

    // Remove X-Frame-Options
    res.setHeader("X-Frame-Options", "ALLOWALL");

    // Rewrite absolute URLs
    html = html.replace(/(href|src)="(https?:\/\/[^"]*)"/g, (m, attr, link) => {
      return `${attr}="/?u=${encodeURIComponent(link)}"`;
    });

    // Rewrite relative URLs
    html = html.replace(/(href|src)="(\/[^"]*)"/g, (m, attr, path) => {
      const full = base.origin + path;
      return `${attr}="/?u=${encodeURIComponent(full)}"`;
    });

    // Rewrite JS fetch()
    html = html.replace(/fetch\(["'`](.*?)["'`]\)/g, (m, url) => {
      const full = url.startsWith("http")
        ? url
        : new URL(url, base).toString();
      return `fetch("/api/p.js?url=${encodeURIComponent(full)}")`;
    });

    // Rewrite XHR
    html = html.replace(/open\(["']GET["'],["'](.*?)["']\)/g, (m, url) => {
      const full = url.startsWith("http")
        ? url
        : new URL(url, base).toString();
      return `open("GET","/api/p.js?url=${encodeURIComponent(full)}")`;
    });

    // Rewrite form actions
    html = html.replace(/<form[^>]*action="([^"]*)"/g, (m, action) => {
      const full = action.startsWith("http")
        ? action
        : new URL(action, base).toString();
      return m.replace(action, `/?u=${encodeURIComponent(full)}`);
    });

    res.setHeader("Content-Type", "text/html");
    res.send(html);

  } catch (e) {
    res.status(500).send("Proxy error");
  }
}
