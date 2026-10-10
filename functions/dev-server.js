import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { isAfricaRegion, AFRICA_COUNTRY_NAMES } from './africa-regions.js'
import { renderBlockedPage } from './blocked-template.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 5001

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  
  // 1. Detect country from headers or query parameters
  const detectedCountry = (
    req.headers['x-appengine-country'] ||
    url.searchParams.get('test_country') ||
    url.searchParams.get('country') ||
    req.headers['x-mock-country'] ||
    ''
  ).toString().trim().toUpperCase()

  // 2. API check endpoint: /api/geo
  if (url.pathname === '/api/geo' || url.pathname === '/api/geo-check') {
    const blocked = isAfricaRegion(detectedCountry)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      country: detectedCountry || 'UNKNOWN',
      countryName: AFRICA_COUNTRY_NAMES[detectedCountry] || null,
      isAfrica: blocked,
      blocked,
      message: blocked
        ? "your regions doesn't has flood this website isn't useful for your regions"
        : 'Region allowed',
    }, null, 2))
    return
  }

  // 3. Check for Africa region block
  if (isAfricaRegion(detectedCountry)) {
    const countryName = AFRICA_COUNTRY_NAMES[detectedCountry] || 'Africa'
    console.log(`[GEO-BLOCK] Blocked African request from: ${countryName} (${detectedCountry}) for path: ${url.pathname}`)
    
    res.writeHead(403, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      'X-Geo-Blocked': 'true',
      'X-Geo-Country': detectedCountry,
    })
    res.end(renderBlockedPage(detectedCountry, countryName))
    return
  }

  // 4. Allowed request: Serve static assets or index.html
  let filePath = path.resolve(__dirname, '../dist', url.pathname.replace(/^\/+/, ''))
  
  // If requesting root or a directory, serve index.html
  if (url.pathname === '/' || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.resolve(__dirname, '../dist/index.html')
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase()
    const mimeTypes = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.svg': 'image/svg+xml',
      '.png': 'image/png',
      '.json': 'application/json',
    }
    const contentType = mimeTypes[ext] || 'application/octet-stream'

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': ext === '.html' ? 'private, no-cache' : 'public, max-age=31536000',
      'X-Geo-Blocked': 'false',
      'X-Geo-Country': detectedCountry || 'ALLOWED',
    })
    fs.createReadStream(filePath).pipe(res)
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Not Found. Build the project first via `pnpm build`.')
  }
})

server.listen(PORT, () => {
  console.log(`\n🌍 Geo-Gatekeeper Dev Server running at: http://localhost:${PORT}`)
  console.log(`\nTest commands:`)
  console.log(`  Allowed request (Thailand):  curl -i "http://localhost:${PORT}/?country=TH"`)
  console.log(`  Blocked request (Nigeria):   curl -i "http://localhost:${PORT}/?country=NG"`)
  console.log(`  Blocked request (Egypt):     curl -i "http://localhost:${PORT}/?country=EG"`)
  console.log(`  Inspect JSON status:        curl -s "http://localhost:${PORT}/api/geo?country=KE"\n`)
})
