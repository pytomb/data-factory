import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

// Default project path
const DEFAULT_PROJECT_PATH = process.env.DATA_FACTORY_PROJECT_PATH ||
  path.join(process.cwd(), '..', '..', 'projects', 'ellembelle-education');

interface TrainingStatus {
  running: boolean;
  step: number;
  total_steps: number;
  epoch: number;
  total_epochs: number;
  loss: number;
  learning_rate: number;
  eta_seconds: number;
  started_at: string | null;
  checkpoint_at: string | null;
  error: string | null;
}

function readTrainingLog(projectPath: string): TrainingStatus {
  const logPath = path.join(projectPath, 'logs', 'training.log');
  const statusPath = path.join(projectPath, '.factory', 'training-status.json');

  // Default status
  const defaultStatus: TrainingStatus = {
    running: false,
    step: 0,
    total_steps: 0,
    epoch: 0,
    total_epochs: 3,
    loss: 0,
    learning_rate: 0,
    eta_seconds: 0,
    started_at: null,
    checkpoint_at: null,
    error: null,
  };

  // Try to read cached status file first
  if (fs.existsSync(statusPath)) {
    try {
      const status = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
      return { ...defaultStatus, ...status };
    } catch {
      // Continue to log parsing
    }
  }

  // Try to parse training log
  if (!fs.existsSync(logPath)) {
    return defaultStatus;
  }

  try {
    const logContent = fs.readFileSync(logPath, 'utf-8');
    const lines = logContent.split('\n').filter(l => l.trim());

    if (lines.length === 0) {
      return defaultStatus;
    }

    // Parse the last few lines for current status
    const recentLines = lines.slice(-20);
    let status = { ...defaultStatus };

    for (const line of recentLines) {
      // Parse step/epoch info
      const stepMatch = line.match(/(?:step|Step)[:\s]*(\d+)[\/\s]*(\d+)?/i);
      if (stepMatch) {
        status.step = parseInt(stepMatch[1], 10);
        if (stepMatch[2]) status.total_steps = parseInt(stepMatch[2], 10);
      }

      const epochMatch = line.match(/(?:epoch|Epoch)[:\s]*(\d+)[\/\s]*(\d+)?/i);
      if (epochMatch) {
        status.epoch = parseInt(epochMatch[1], 10);
        if (epochMatch[2]) status.total_epochs = parseInt(epochMatch[2], 10);
      }

      // Parse loss
      const lossMatch = line.match(/(?:loss|Loss)[:\s]*([0-9.]+)/i);
      if (lossMatch) {
        status.loss = parseFloat(lossMatch[1]);
      }

      // Parse learning rate
      const lrMatch = line.match(/(?:lr|learning_rate)[:\s]*([0-9.e-]+)/i);
      if (lrMatch) {
        status.learning_rate = parseFloat(lrMatch[1]);
      }

      // Check for completion
      if (line.toLowerCase().includes('training complete') || line.toLowerCase().includes('finished training')) {
        status.running = false;
      }

      // Check for errors
      if (line.toLowerCase().includes('error') || line.toLowerCase().includes('exception')) {
        status.error = line;
        status.running = false;
      }

      // Check for checkpoint
      if (line.toLowerCase().includes('checkpoint') || line.toLowerCase().includes('saving')) {
        const timeMatch = line.match(/\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}:\d{2}/);
        if (timeMatch) {
          status.checkpoint_at = timeMatch[0];
        }
      }
    }

    // Determine if running based on file modification time
    const logStat = fs.statSync(logPath);
    const msSinceModified = Date.now() - logStat.mtime.getTime();
    status.running = msSinceModified < 60000; // Consider running if modified in last minute

    // Extract start time from first log line
    if (lines.length > 0) {
      const startTimeMatch = lines[0].match(/\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}:\d{2}/);
      if (startTimeMatch) {
        status.started_at = startTimeMatch[0];
      }
    }

    // Estimate ETA
    if (status.running && status.step > 0 && status.total_steps > 0) {
      const elapsedSeconds = (Date.now() - (status.started_at ? new Date(status.started_at).getTime() : Date.now())) / 1000;
      const stepsRemaining = status.total_steps - status.step;
      const secondsPerStep = elapsedSeconds / status.step;
      status.eta_seconds = Math.round(stepsRemaining * secondsPerStep);
    }

    return status;
  } catch (e) {
    console.error('Error parsing training log:', e);
    return defaultStatus;
  }
}

export async function GET(request: NextRequest) {
  const projectPath = request.nextUrl.searchParams.get('project') || DEFAULT_PROJECT_PATH;

  const status = readTrainingLog(projectPath);

  return NextResponse.json(status);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, projectPath: bodyProjectPath, ...data } = body;
  const projectPath = bodyProjectPath || DEFAULT_PROJECT_PATH;

  const statusPath = path.join(projectPath, '.factory', 'training-status.json');

  switch (action) {
    case 'update':
      // Update training status (called by training script)
      const currentStatus = readTrainingLog(projectPath);
      const updatedStatus = { ...currentStatus, ...data, last_updated: new Date().toISOString() };

      fs.mkdirSync(path.dirname(statusPath), { recursive: true });
      fs.writeFileSync(statusPath, JSON.stringify(updatedStatus, null, 2));

      return NextResponse.json({ success: true, status: updatedStatus });

    case 'start':
      // Mark training as started
      const startStatus: TrainingStatus = {
        running: true,
        step: 0,
        total_steps: data.total_steps || 1000,
        epoch: 0,
        total_epochs: data.total_epochs || 3,
        loss: 0,
        learning_rate: data.learning_rate || 2e-4,
        eta_seconds: 0,
        started_at: new Date().toISOString(),
        checkpoint_at: null,
        error: null,
      };

      fs.mkdirSync(path.dirname(statusPath), { recursive: true });
      fs.writeFileSync(statusPath, JSON.stringify(startStatus, null, 2));

      return NextResponse.json({ success: true, status: startStatus });

    case 'stop':
      // Mark training as stopped
      const stopStatus = readTrainingLog(projectPath);
      stopStatus.running = false;

      fs.writeFileSync(statusPath, JSON.stringify(stopStatus, null, 2));

      return NextResponse.json({ success: true, status: stopStatus });

    case 'error':
      // Record training error
      const errorStatus = readTrainingLog(projectPath);
      errorStatus.running = false;
      errorStatus.error = data.error || 'Unknown error';

      fs.writeFileSync(statusPath, JSON.stringify(errorStatus, null, 2));

      return NextResponse.json({ success: true, status: errorStatus });

    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }
}
