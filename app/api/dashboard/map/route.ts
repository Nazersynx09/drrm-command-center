import { NextResponse } from 'next/server';
import { getMapData } from '@/lib/dashboard/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json(await getMapData(), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Dashboard map error:', error);
    return NextResponse.json({ error: 'Unable to load map data.' }, { status: 500 });
  }
}
