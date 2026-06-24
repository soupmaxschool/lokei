function proxifyUrl(targetUrl, baseUrl) {
  try {
    const abs = new URL(targetUrl, baseUrl).href;
    return "/api/p?url=" + encodeURIComponent(abs);
  } catch {
    return targetUrl;
  }
}

function rewriteHtml(html, baseUrl) {
  // href / src / action
  html = html.replace(
    /\b(href|src|action)\s*=\s*(['"])(.*?)\2/gi,
    (m, attr, quote, value) => {
      if (value.startsWith("javascript:") || value.startsWith("data:")) return m;
      const proxied = proxifyUrl(value, baseUrl);
      return `${attr}=${quote}${proxied}${quote}`;
    }
  );

  // CSS url(...)
  html = html.replace(
    /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi,
    (m, quote, value) => {
      if (value.startsWith("data:")) return m;
      const proxied = proxifyUrl(value, baseUrl);
      return `url(${quote}${proxied}${quote})`;
    }
  );

  return html;
}

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

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) break;
        url = new URL(location, url).href;
        continue;
      }

      const contentType = response.headers.get("content-type") || "text/html";
      res.setHeader("content-type", contentType);
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "*");

      if (contentType.includes("text/html")) {
        let text = await response.text();
        text = rewriteHtml(text, url);
        res.status(response.status).send(text);
      } else {
        const buffer = Buffer.from(await response.arrayBuffer());
        res.status(response.status).send(buffer);
      }
      return;
    }

    res.status(500).send("Too many redirects");
  } catch (err) {
    res.status(500).send("Proxy error: " + err.message);
  }
}
