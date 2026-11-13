/**
 * Structured contact intake endpoint (`/api/contact`).
 *
 * Validates visitor inquiries, blocks honeypot bots, sends email via Gmail SMTP
 * when configured (SMTP_USER / SMTP_PASS), optionally forwards to webhook /
 * Telegram channels, and returns a transparent delivery receipt.
 */

import nodemailer from 'nodemailer';

const TOPICS = {
  hiring: 'Full-time / AI Engineering Role',
  project: 'AI Product / Production Build',
  consulting: 'Architecture Review & Advisory',
  other: 'General Collaboration',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

let cachedTransportKey = '';
let cachedTransporter = null;

const reply = (statusCode, body) => ({
  statusCode,
  headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  body: JSON.stringify(body),
});

const clean = (val, max = 300) => (typeof val === 'string' ? val.trim().replace(/\s+/g, ' ').slice(0, max) : '');

const cleanMessage = (val, max = 3000) =>
  typeof val === 'string'
    ? val
        .replace(/\r\n/g, '\n')
        .trim()
        .slice(0, max)
    : '';

const cleanHeaderName = (val) =>
  String(val || '')
    .replace(/[\r\n"<>]/g, ' ')
    .trim()
    .slice(0, 100);

const escapeHtml = (str) =>
  String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

async function postJsonWithTimeout(url, body, timeoutMs = 6000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

function getTransporter({ host, port, user, pass }) {
  const key = `${host}|${port}|${user}|${pass}`;
  if (cachedTransporter && cachedTransportKey === key) return cachedTransporter;
  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
  });
  cachedTransportKey = key;
  return cachedTransporter;
}

export async function sendGmailNotification(receipt) {
  const user = (process.env.SMTP_USER || '').trim();
  const pass = (process.env.SMTP_PASS || '').replace(/\s+/g, '').trim();
  if (!user || !pass) return { attempted: false, ok: false };

  const host = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const port = Number(process.env.SMTP_PORT) || 465;
  const to = (process.env.CONTACT_TO_EMAIL || user || 'daovinhkhang0834@gmail.com').trim();
  const { id, receivedAt, summary } = receipt;

  const textBody = [
    `New contact inquiry from daovinhkhang.site`,
    `Reference ID: ${id}`,
    `Received At:  ${receivedAt}`,
    ``,
    `From:         ${summary.name} <${summary.email}>`,
    `Topic:        ${summary.topicLabel}`,
    summary.company ? `Company:      ${summary.company}` : null,
    ``,
    `Message:`,
    `----------------------------------------`,
    summary.message,
  ]
    .filter((line) => line !== null)
    .join('\n');

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111111; background: #ffffff; max-width: 600px; margin: 0 auto; border: 1px solid #d6d6d6; border-radius: 10px; overflow: hidden;">
      <div style="background: #111111; color: #ffffff; padding: 20px 24px;">
        <div style="font-family: monospace; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; opacity: 0.72;">daovinhkhang.site · Contact Intake</div>
        <h2 style="margin: 6px 0 0; font-size: 20px; font-weight: 700;">${escapeHtml(summary.topicLabel)}</h2>
      </div>
      <div style="padding: 22px 24px;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #5d5d5d; width: 110px; font-family: monospace; font-size: 12px;">Reference</td>
            <td style="padding: 6px 0; font-weight: 600;">${escapeHtml(id)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #5d5d5d; font-family: monospace; font-size: 12px;">From</td>
            <td style="padding: 6px 0;">${escapeHtml(summary.name)} &lt;<a href="mailto:${escapeHtml(summary.email)}" style="color: #111111;">${escapeHtml(summary.email)}</a>&gt;</td>
          </tr>
          ${
            summary.company
              ? `<tr><td style="padding: 6px 0; color: #5d5d5d; font-family: monospace; font-size: 12px;">Company</td><td style="padding: 6px 0;">${escapeHtml(summary.company)}</td></tr>`
              : ''
          }
        </table>
        <div style="padding: 16px; background: #f7f7f7; border: 1px solid #e2e2e2; border-radius: 8px; white-space: pre-wrap; line-height: 1.55; font-size: 15px;">${escapeHtml(summary.message)}</div>
        <p style="margin: 16px 0 0; font-size: 12px; color: #5d5d5d;">Reply directly to this email to respond to ${escapeHtml(summary.name)}.</p>
      </div>
    </div>
  `.trim();

  try {
    const transporter = getTransporter({ host, port, user, pass });
    const info = await transporter.sendMail({
      from: `"daovinhkhang.site Concierge" <${user}>`,
      to,
      replyTo: `"${cleanHeaderName(summary.name)}" <${summary.email}>`,
      subject: `[daovinhkhang.site · ${summary.topicLabel}] ${cleanHeaderName(summary.name)} (${id})`,
      text: textBody,
      html: htmlBody,
    });
    return { attempted: true, ok: true, messageId: info?.messageId || '' };
  } catch (err) {
    console.error(`[contact:${id}] gmail_smtp_error:`, err?.message || String(err));
    return { attempted: true, ok: false, error: err?.message || 'smtp_error' };
  }
}

export async function forwardInquiry(receipt) {
  const channels = [];

  const webhook = process.env.CONTACT_WEBHOOK_URL;
  if (webhook) {
    const ok = await postJsonWithTimeout(webhook, {
      event: 'portfolio_contact_inquiry',
      ...receipt,
    });
    if (ok) channels.push('webhook');
  }

  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const tgChat = process.env.TELEGRAM_CHAT_ID;
  if (tgToken && tgChat) {
    const lines = [
      `New inquiry [${receipt.id}]`,
      `Name: ${receipt.summary.name}`,
      `Email: ${receipt.summary.email}`,
      `Topic: ${receipt.summary.topicLabel}`,
      receipt.summary.company ? `Company: ${receipt.summary.company}` : null,
      '',
      receipt.summary.message,
    ]
      .filter((x) => x !== null)
      .join('\n');
    const ok = await postJsonWithTimeout(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
      chat_id: tgChat,
      text: lines.slice(0, 3800),
    });
    if (ok) channels.push('telegram');
  }

  return channels;
}

export function validateInquiry(raw) {
  const name = clean(raw?.name, 120);
  const email = clean(raw?.email, 160).toLowerCase();
  const topicRaw = clean(raw?.topic, 40).toLowerCase();
  const topic = Object.hasOwn(TOPICS, topicRaw) ? topicRaw : 'project';
  const company = clean(raw?.company, 140);
  const message = cleanMessage(raw?.message, 3000);
  const botField = clean(raw?.botField, 80);

  const fields = {};
  if (!name || name.length < 2) fields.name = 'Please enter your name (at least 2 characters).';
  if (!email || !EMAIL_RE.test(email)) fields.email = 'Please enter a valid email address.';
  if (!message || message.length < 10) fields.message = 'Please add a short brief (at least 10 characters).';

  return {
    botDetected: Boolean(botField),
    valid: Object.keys(fields).length === 0,
    fields,
    summary: {
      name,
      email,
      topic,
      topicLabel: TOPICS[topic],
      company,
      message,
    },
  };
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return reply(405, { error: 'Method not allowed' });

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return reply(400, { error: 'Bad JSON' });
  }

  const check = validateInquiry(payload);
  const id = `KHG-${Date.now().toString(36).toUpperCase().slice(-5)}`;
  const receivedAt = new Date().toISOString();

  if (check.botDetected) {
    return reply(200, {
      ok: true,
      id,
      receivedAt,
      deliveredVia: ['filtered'],
      directEmail: process.env.CONTACT_TO_EMAIL || 'daovinhkhang0834@gmail.com',
      summary: check.summary,
    });
  }

  if (!check.valid) {
    return reply(400, {
      error: 'validation_failed',
      fields: check.fields,
    });
  }

  const receipt = { id, receivedAt, summary: check.summary };
  const [gmailResult, forwarded] = await Promise.all([
    sendGmailNotification(receipt),
    forwardInquiry(receipt),
  ]);

  const deliveredVia = [];
  if (gmailResult.ok) deliveredVia.push('gmail');
  deliveredVia.push(...forwarded);
  if (payload?.netlifySynced) deliveredVia.push('netlify-forms');

  if (gmailResult.attempted && !gmailResult.ok && !deliveredVia.length) {
    return reply(502, {
      ok: false,
      error: 'email_delivery_failed',
      detail: 'Could not send via Gmail right now. Please retry or use Open Email App below.',
    });
  }

  if (!deliveredVia.length) {
    const isNetlify = Boolean(process.env.NETLIFY || event.headers?.['x-nf-request-id']);
    deliveredVia.push(isNetlify ? 'netlify-function-log' : 'local-preview');
  }

  console.info(
    `[contact:${id}] topic=${check.summary.topic} from=${check.summary.email} channels=${deliveredVia.join(',')}`,
  );

  return reply(200, {
    ok: true,
    id,
    receivedAt,
    deliveredVia,
    directEmail: process.env.CONTACT_TO_EMAIL || 'daovinhkhang0834@gmail.com',
    summary: check.summary,
  });
};
