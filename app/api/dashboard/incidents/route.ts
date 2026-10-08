import { NextRequest, NextResponse } from 'next/server';
import { getIncidentFeed } from '@/lib/dashboard/queries';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') ?? 50), 100);
    return NextResponse.json({ incidents: await getIncidentFeed(limit) }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Incident feed error:', error);
    return NextResponse.json({ error: 'Unable to load incident feed.' }, { status: 500 });
  }
}
