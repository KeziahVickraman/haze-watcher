const DATA_GOV_SG_PSI_URL = 'https://api-open.data.gov.sg/v2/real-time/api/psi';

export interface DataGovSgPsiResponse {
  code: number;
  data: {
    regionMetadata: Array<{
      name: string;
      labelLocation: {
        latitude: number;
        longitude: number;
      };
    }>;
    items: Array<{
      date: string;
      updatedTimestamp: string;
      timestamp: string;
      readings: {
        psi_twenty_four_hourly?: Record<string, number>;
        pm25_twenty_four_hourly?: Record<string, number>;
        pm25_one_hourly?: Record<string, number>;
        pm10_twenty_four_hourly?: Record<string, number>;
        so2_twenty_four_hourly?: Record<string, number>;
        co_eight_hour_max?: Record<string, number>;
        o3_eight_hour_max?: Record<string, number>;
        no2_one_hour_max?: Record<string, number>;
      };
    }>;
  };
  errorMsg?: string;
}

/**
 * Universal Serverless & Express handler for /api/psi
 * Fetches real-time PSI from api-open.data.gov.sg (no API key required)
 */
export default async function handler(req: any, res?: any) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    if (res && typeof res.status === 'function') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return res.status(200).end();
    }
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const upstreamResponse = await fetch(DATA_GOV_SG_PSI_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SGAirWatch-Serverless/1.0',
      },
    });

    if (!upstreamResponse.ok) {
      const errorText = await upstreamResponse.text();
      const errorPayload = {
        success: false,
        error: `Upstream data.gov.sg returned HTTP ${upstreamResponse.status}`,
        details: errorText,
        source: DATA_GOV_SG_PSI_URL,
        timestamp: new Date().toISOString(),
      };

      if (!res && req instanceof Request) {
        return new Response(JSON.stringify(errorPayload), {
          status: upstreamResponse.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      if (res && typeof res.status === 'function') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(upstreamResponse.status).json(errorPayload);
      }
      return errorPayload;
    }

    const payload: DataGovSgPsiResponse = await upstreamResponse.json();

    // Extract the latest readings
    const latestItem = payload.data?.items?.[0];
    const regionMetadata = payload.data?.regionMetadata || [];
    const readings = latestItem?.readings || {};

    // Standardized response enriched with metadata
    const responseData = {
      success: true,
      statusCode: payload.code,
      source: 'data.gov.sg (v2 real-time)',
      endpoint: DATA_GOV_SG_PSI_URL,
      timestamp: latestItem?.timestamp || new Date().toISOString(),
      updatedTimestamp: latestItem?.updatedTimestamp || new Date().toISOString(),
      regions: regionMetadata,
      readings,
      raw: payload,
    };

    // If used in standard Web Fetch API / Edge Runtime (Next.js Edge / Cloudflare Workers / Vercel Edge)
    if (!res && req instanceof Request) {
      return new Response(JSON.stringify(responseData), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=60, s-maxage=120, stale-while-revalidate=300',
        },
      });
    }

    // If used in Express / Node.js Serverless runtime (Vercel Node, AWS Lambda, Cloud Run, Express)
    if (res && typeof res.status === 'function') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=300');
      return res.status(200).json(responseData);
    }

    return responseData;
  } catch (error: any) {
    console.error('Error fetching live PSI from data.gov.sg:', error);
    const errorBody = {
      success: false,
      error: 'Failed to retrieve live data from data.gov.sg',
      message: error?.message || 'Unknown network error',
      timestamp: new Date().toISOString(),
    };

    if (!res && req instanceof Request) {
      return new Response(JSON.stringify(errorBody), {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    if (res && typeof res.status === 'function') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(502).json(errorBody);
    }

    return errorBody;
  }
}

// Named export for Web Standard GET (Fetch API / Next.js Edge)
export async function GET(request: Request) {
  return handler(request);
}
