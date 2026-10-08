import { NextResponse } from 'next/server';
import { getDashboardSummary } from '@/lib/dashboard/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json(await getDashboardSummary(), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    return NextResponse.json({ error: 'Unable to load dashboard summary.' }, { status: 500 });
  }
}
