// /api/proxy.js
export default async function handler(req, res) {
  const target = req.query.url;
  if (!target) {
    return res.status(400).send("Missing ?url=");
  }

  try {
    const response = await fetch(target, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const contentType = response.headers.get("content-type") || "text/html";
    res.setHeader("Content-Type", contentType);

    const body = await response.text();
    res.status(response.status).send(body);
  } catch (err) {
    res.status(500).send("Fetch failed");
  }
}
