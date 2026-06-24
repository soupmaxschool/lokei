export default async function handler(req, res) {
  let url = req.query.url;
  if (!url) return res.status(400).send("Missing url");

  let maxRedirects = 10;

  for (let i = 0; i < maxRedirects; i++) {
    const response = await fetch(url, {
      redirect: "manual",
      headers: {
        "User-Agent": req.headers["user-agent"] || "Mozilla/5.0",
        "Accept": "*/*"
      }
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) break;

      url = new URL(location, url).href;
      continue;
    }

    const contentType = response.headers.get("content-type") || "text/html";
    const body = await response.arrayBuffer();

    res.setHeader("content-type", contentType);
    res.status(response.status).send(Buffer.from(body));
    return;
  }

  res.status(500).send("Too many redirects");
}
