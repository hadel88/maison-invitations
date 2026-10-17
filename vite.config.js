import { defineConfig, loadEnv } from "vite";
export default defineConfig(({ mode }) => ({
  server: { fs: { allow: [process.cwd()] } },
  plugins: [
    {
      name: "maison-local-api",
      configureServer(server) {
        Object.assign(process.env, loadEnv(mode, process.cwd(), ""));
        server.middlewares.use("/api/app", async (req, res) => {
          try {
            const { default: handler } = await import("./api/app.js");
            const url = new URL(req.url, "http://localhost");
            req.query = Object.fromEntries(url.searchParams);
            let raw = "";
            for await (const chunk of req) {
              raw += chunk;
              if (raw.length > 1600000) {
                res.statusCode = 413;
                res.end();
                return;
              }
            }
            req.body = raw;
            res.status = (code) => {
              res.statusCode = code;
              return res;
            };
            res.json = (data) => {
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(data));
            };
            await handler(req, res);
          } catch (e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
          }
        });
      },
    },
  ],
}));
