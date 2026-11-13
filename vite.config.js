import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Mounts netlify/functions/chat.mjs at /api/chat during `vite dev` and
 * `vite preview`, so local work exercises the real handler instead of a stub.
 *
 * The handler reads process.env.UPSTREAM_KEY, so the env files are copied into
 * process.env before it is imported. Nothing here ships in the production
 * build — Netlify serves the same file itself.
 */
function assistantApi(mode) {
  const applyEnv = () => {
    const env = loadEnv(mode, process.cwd(), '');
    for (const k of [
      'UPSTREAM_KEY',
      'UPSTREAM_URL',
      'UPSTREAM_MODEL',
      'UPSTREAM_REASONING',
      'CONTACT_WEBHOOK_URL',
      'TELEGRAM_BOT_TOKEN',
      'TELEGRAM_CHAT_ID',
      'SMTP_HOST',
      'SMTP_PORT',
      'SMTP_USER',
      'SMTP_PASS',
      'CONTACT_TO_EMAIL',
    ]) {
      if (env[k]) process.env[k] = env[k];
    }
    return Boolean(env.UPSTREAM_KEY);
  };

  let announced = false;

  const middleware = async (req, res, next) => {
    const isChat = req.url?.startsWith('/api/chat');
    const isContact = req.url?.startsWith('/api/contact');
    if (!isChat && !isContact) return next();

    const hasKey = applyEnv();
    if (isChat && !announced) {
      announced = true;
      // Loud enough that a missing key is never a silent mystery.
      console.log(
        hasKey
          ? '  ➜  /api/chat  live model enabled'
          : '  ➜  /api/chat  UPSTREAM_KEY missing — the widget will answer from the local knowledge base',
      );
    }

    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('content-type', 'application/json');
      return res.end(JSON.stringify({ error: 'Method not allowed' }));
    }

    let body = '';
    for await (const chunk of req) body += chunk;

    try {
      const targetMod = isContact ? './netlify/functions/contact.mjs' : './netlify/functions/chat.mjs';
      const { handler } = await import(targetMod);
      const out = await handler({ httpMethod: 'POST', body, headers: req.headers });
      res.statusCode = out.statusCode;
      for (const [k, v] of Object.entries(out.headers || {})) res.setHeader(k, v);
      res.end(out.body);
    } catch (err) {
      res.statusCode = 500;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ error: 'dev_proxy_failed', detail: String(err).slice(0, 300) }));
    }
  };

  return {
    name: 'assistant-api',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), assistantApi(mode)],
}));
