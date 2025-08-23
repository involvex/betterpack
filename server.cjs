const { createServer } = require("http")
const { parse } = require("url")
const next = require("next")
const { createWebSocketServer } = require("./src/agent/ws-server.cjs")


const dev = process.env.NODE_ENV !== "production"
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    const { pathname, query } = parsedUrl

    if (pathname.startsWith("/api/agent")) {
      return app.render(req, res, "/api/agent", query)
    }

    handle(req, res, parsedUrl)
  })

  if (!dev) {
    createWebSocketServer(server)
  }

  const port = process.env.PORT || 3000
  server.listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://localhost:${port}`)
  })
})
