import { NextResponse } from 'next/server';
import { init } from '@/lib/db';

function getIpFromReq(req) {
  const xf = req.headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0].trim();
  return req.headers.get('x-real-ip') || req.ip || null;
}

export async function POST(req) {
  try {
    const db = await init();
    const body = await req.json();
    const path = body.path ? String(body.path) : '/';
    // normalize path (strip querystring if accidentally provided)
    const normalizedPath = path.split('?')[0];

    // Do not track admin routes or dashboard-admin (including subpaths)
    if (
      normalizedPath === '/admin' ||
      normalizedPath.startsWith('/admin/') ||
      normalizedPath === '/dashboard-admin' ||
      normalizedPath.startsWith('/dashboard-admin/') ||
      normalizedPath === '/order' ||
      normalizedPath.startsWith('/order/')
    ) {
      // 204 No Content — intentionally not tracked
      return new NextResponse(null, { status: 204 });
    }
    const hostname = body.hostname ? String(body.hostname) : null;
    const referrer = body.referrer ? String(body.referrer) : null;
    const userAgent = body.userAgent ? String(body.userAgent) : (req.headers.get('user-agent') || null);
    const lang = body.lang ? String(body.lang) : null;
    const ip = getIpFromReq(req) || body.ip || null;

    db.prepare(
      `INSERT INTO page_views (path, hostname, referrer, user_agent, ip, lang)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(path, hostname, referrer, userAgent, ip, lang);

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const db = await init();
    const url = new URL(req.url);
    const q = url.searchParams.get('q');
    const since = url.searchParams.get('since'); // e.g. '30 days'

    // recent views (limit 100)
    const recent = db.prepare('SELECT id, path, hostname, referrer, user_agent, ip, lang, created_at FROM page_views ORDER BY id DESC LIMIT 100').all();

    // top pages in timeframe (optional)
    let topPagesSql = `SELECT path, COUNT(*) AS views FROM page_views`;
    const params = [];
    if (since) {
      topPagesSql += ` WHERE created_at >= date('now','-${since}')`;
    }
    topPagesSql += ` GROUP BY path ORDER BY views DESC LIMIT 50`;
    const topPages = db.prepare(topPagesSql).all(...params);

    // optionally filter by path
    let list = null;
    if (q) {
      list = db.prepare('SELECT id, path, hostname, referrer, user_agent, ip, lang, created_at FROM page_views WHERE path = ? ORDER BY id DESC LIMIT 500').all(q);
    }

    return NextResponse.json({ recent, topPages, list }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
