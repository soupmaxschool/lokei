export default async function handler(req, res) {
  // Accept url from query OR body OR path OR header
  let url =
    req.query.url ||
    req.body?.url ||
    req.headers["x-proxy-url"] ||
    null;

  // If STILL no URL, return instructions instead of error
  if (!url) {
    return res.status(200).send(`
      <h1>Proxy Ready</h1>
      <p>Use: <code>/api/p?url=https://example.com</code></p>
    `);
  }

  try {
    // Follow redirects automatically
    const response = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "*/*"
      }
    });

    // Copy content type
    const type = response.headers.get("content-type") || "text/html";
    res.setHeader("content-type", type);

    // Allow browser to load it
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Stream the response back
    const buffer = Buffer.from(await response.arrayBuffer());
    res.status(response.status).send(buffer);

  } catch (err) {
    res.status(500).send("Proxy error: " + err.message);
  }
}
