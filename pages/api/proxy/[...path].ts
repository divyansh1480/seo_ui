import type { NextApiRequest, NextApiResponse } from 'next';

const BACKEND = process.env.BACKEND_API_URL || 'http://15.206.125.175:3000';
const API_KEY = process.env.API_KEY || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { path, ...query } = req.query;
  const pathStr = Array.isArray(path) ? path.join('/') : path || '';

  const qs = new URLSearchParams(query as Record<string, string>).toString();
  const url = `${BACKEND}/api/${pathStr}${qs ? `?${qs}` : ''}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  };

  const fetchOpts: RequestInit = {
    method: req.method,
    headers,
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    fetchOpts.body = JSON.stringify(req.body);
  }

  try {
    const backendRes = await fetch(url, fetchOpts);
    const data = await backendRes.json();
    res.status(backendRes.status).json(data);
  } catch (err: any) {
    res.status(502).json({ ok: false, error: 'Backend unreachable: ' + err.message });
  }
}
