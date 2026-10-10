/**
 * Generates the HTTP 403 Forbidden HTML page when a user from Africa accesses the site.
 * @param {string} countryCode
 * @param {string} countryName
 * @returns {string} HTML string
 */
export function renderBlockedPage(countryCode = 'UNKNOWN', countryName = 'Africa') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>403 Forbidden - iLeak</title>
  <link rel="icon" type="image/svg+xml" href="/vite.svg" />
  <style>
    :root {
      --bg: #090a0f;
      --card-bg: #12141c;
      --border: #232738;
      --text: #f0f2f8;
      --muted: #8b92a5;
      --gold: #d4af37;
      --gold-hi: #f5cf47;
      --red: #f87171;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: radial-gradient(circle at 50% 20%, #171b29 0%, var(--bg) 70%);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      text-align: center;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 48px 28px;
      max-width: 540px;
      width: 100%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
    }
    .icon {
      font-size: 72px;
      line-height: 1;
      margin-bottom: 20px;
      animation: float 3s ease-in-out infinite;
    }
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }
    .eyebrow {
      display: inline-block;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--red);
      background: rgba(248, 113, 113, 0.12);
      border: 1px solid rgba(248, 113, 113, 0.3);
      padding: 4px 12px;
      border-radius: 9999px;
      margin-bottom: 16px;
    }
    h1 {
      font-size: clamp(22px, 5vw, 28px);
      font-weight: 800;
      line-height: 1.3;
      margin-bottom: 16px;
      color: #fff;
    }
    .highlight {
      color: var(--gold-hi);
    }
    p {
      color: var(--muted);
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .region-tag {
      background: #191c28;
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 12px 16px;
      font-family: monospace;
      font-size: 14px;
      color: #a5b4fc;
      margin-bottom: 24px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .status-badge {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--red);
    }
    .footer-note {
      font-size: 12px;
      color: #5d6479;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">☀️🌊⚡</div>
    <div class="eyebrow">HTTP 403 Forbidden • Geo Restricted</div>
    <h1>Your region doesn't have floods. <br><span class="highlight">This website isn't useful for your region.</span></h1>
    <p>
      iLeak is engineered exclusively for detecting live electrical leakage in urban floodwaters using submerged USB-C cables. Since your region currently has no relevant flood conditions, access has been restricted.
    </p>
    <div class="region-tag">
      <span class="status-badge"></span>
      <span>Detected Region: <strong>${countryName} (${countryCode})</strong></span>
    </div>
    <p class="footer-note">
      Stay safe and dry. If you believe this is in error, check your network gateway or VPN location.
    </p>
  </div>
</body>
</html>`
}
