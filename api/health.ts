import type { Request, Response } from 'express';

export interface HealthResponse {
  status: 'ok' | 'degraded';
  timestamp: string;
  uptimeSeconds: number;
  service: string;
  environment: string;
  endpoints: {
    psi: string;
    health: string;
  };
}

/**
 * Universal Serverless & Express handler for /api/health
 */
export default async function handler(req: any, res?: any) {
  const healthData: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: typeof process !== 'undefined' && process.uptime ? Math.round(process.uptime()) : 0,
    service: 'SG AirWatch Serverless API',
    environment: process.env.NODE_ENV || 'production',
    endpoints: {
      psi: '/api/psi',
      health: '/api/health',
    },
  };

  // If used in standard Web Fetch API / Edge Runtime (e.g., Next.js / Cloudflare / Vercel Edge)
  if (!res && req instanceof Request) {
    return new Response(JSON.stringify(healthData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // If used in Express / Node.js Serverless runtime (Vercel Node, AWS Lambda, Cloud Run, Express)
  if (res && typeof res.status === 'function') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.status(200).json(healthData);
  }

  return healthData;
}

// Named export for Web Standard GET (Fetch API / Next.js Edge)
export async function GET(request: Request) {
  return handler(request);
}
