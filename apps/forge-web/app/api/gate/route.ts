import { NextRequest, NextResponse } from 'next/server';
import * as path from 'path';
import { checkGate, GateResult } from '../../../lib/gates';
import { type GateId } from '../../../lib/workflow';

// Default project path
const DEFAULT_PROJECT_PATH = process.env.DATA_FACTORY_PROJECT_PATH ||
  path.join(process.cwd(), '..', '..', 'projects', 'ellembelle-education');

export async function GET(request: NextRequest) {
  const gateId = request.nextUrl.searchParams.get('gateId') as GateId | null;
  const projectPath = request.nextUrl.searchParams.get('project') || DEFAULT_PROJECT_PATH;

  if (!gateId) {
    return NextResponse.json(
      { error: 'gateId parameter is required' },
      { status: 400 }
    );
  }

  try {
    const result = await checkGate(gateId, projectPath);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Gate check error:', error);
    return NextResponse.json(
      { error: 'Failed to check gate', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { gateId, projectPath: bodyProjectPath } = body;
  const projectPath = bodyProjectPath || DEFAULT_PROJECT_PATH;

  if (!gateId) {
    return NextResponse.json(
      { error: 'gateId is required' },
      { status: 400 }
    );
  }

  try {
    const result = await checkGate(gateId as GateId, projectPath);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Gate check error:', error);
    return NextResponse.json(
      { error: 'Failed to check gate', details: String(error) },
      { status: 500 }
    );
  }
}
