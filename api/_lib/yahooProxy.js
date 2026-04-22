const DEFAULT_HEADERS = {
  referer: "https://finance.yahoo.com/",
  origin: "https://finance.yahoo.com",
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  accept: "application/json, text/plain, */*",
};

function appendQueryParams(url, query) {
  for (const [key, rawValue] of Object.entries(query)) {
    if (key === "path" || rawValue == null) {
      continue;
    }

    if (Array.isArray(rawValue)) {
      for (const value of rawValue) {
        url.searchParams.append(key, String(value));
      }
      continue;
    }

    url.searchParams.append(key, String(rawValue));
  }
}

export async function proxyYahooRequest(req, res, targetBaseUrl) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rawPath = req.query.path;
  const pathSegments = Array.isArray(rawPath) ? rawPath : rawPath ? [rawPath] : [];
  const normalizedPath = pathSegments.map((segment) => encodeURIComponent(segment)).join("/");
  const targetUrl = new URL(`/${normalizedPath}`, targetBaseUrl);

  appendQueryParams(targetUrl, req.query);

  try {
    const upstreamResponse = await fetch(targetUrl, {
      headers: DEFAULT_HEADERS,
    });

    const responseBody = await upstreamResponse.text();
    const contentType = upstreamResponse.headers.get("content-type") ?? "application/json; charset=utf-8";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=120");

    return res.status(upstreamResponse.status).send(responseBody);
  } catch (error) {
    return res.status(502).json({
      error: "Failed to reach Yahoo Finance",
      details: error instanceof Error ? error.message : "Unknown proxy error",
    });
  }
}
