import { NextResponse } from 'next/server';
import { getAdvisories } from '@/lib/advisories';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json(
      {
        advisories: await getAdvisories(),
        generatedAt: new Date().toISOString(),
        providers: {
          PAGASA: Boolean(process.env.PAGASA_API_TOKEN),
          GDACS: true,
          'Open-Meteo': true,
          USGS: true,
        },
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('Advisories error:', error);
    return NextResponse.json(
      { advisories: [], error: 'Unable to load external advisories.' },
      { status: 502 },
    );
  }
}
