import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

// Default project path
const DEFAULT_PROJECT_PATH = process.env.DATA_FACTORY_PROJECT_PATH ||
  path.join(process.cwd(), '..', '..', 'projects', 'ellembelle-education');

interface DatasetInfo {
  id: string;
  name: string;
  path: string;
  format: 'raw' | 'annotated' | 'cleaned' | 'training';
  sample_count: number;
  size_mb: number;
  created_at: string;
  validated: boolean;
  validation_report?: string;
}

interface DataManifest {
  project_id: string;
  datasets: Record<string, DatasetInfo>;
  models: Record<string, unknown>;
  last_updated: string;
}

function readManifest(projectPath: string): DataManifest | null {
  const manifestPath = path.join(projectPath, '.factory', 'data-manifest.json');

  if (!fs.existsSync(manifestPath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  } catch {
    return null;
  }
}

function scanDataDirectories(projectPath: string): DatasetInfo[] {
  const datasets: DatasetInfo[] = [];
  const dataDir = path.join(projectPath, 'data');

  if (!fs.existsSync(dataDir)) {
    return datasets;
  }

  const formats: Array<{ dir: string; format: DatasetInfo['format'] }> = [
    { dir: 'raw', format: 'raw' },
    { dir: 'annotated', format: 'annotated' },
    { dir: 'cleaned', format: 'cleaned' },
    { dir: 'training', format: 'training' },
    { dir: 'splits', format: 'training' },
  ];

  for (const { dir, format } of formats) {
    const formatDir = path.join(dataDir, dir);
    if (!fs.existsSync(formatDir)) continue;

    try {
      const files = fs.readdirSync(formatDir);
      for (const file of files) {
        const filePath = path.join(formatDir, file);
        const stat = fs.statSync(filePath);

        if (stat.isFile() && (file.endsWith('.json') || file.endsWith('.jsonl') || file.endsWith('.csv'))) {
          // Count samples for JSONL files
          let sampleCount = 0;
          if (file.endsWith('.jsonl')) {
            const content = fs.readFileSync(filePath, 'utf-8');
            sampleCount = content.split('\n').filter(line => line.trim()).length;
          }

          datasets.push({
            id: `${dir}-${file}`,
            name: file,
            path: `data/${dir}/${file}`,
            format,
            sample_count: sampleCount,
            size_mb: stat.size / (1024 * 1024),
            created_at: stat.birthtime.toISOString(),
            validated: false,
          });
        }
      }
    } catch (e) {
      console.error(`Error scanning ${formatDir}:`, e);
    }
  }

  return datasets;
}

export async function GET(request: NextRequest) {
  const projectPath = request.nextUrl.searchParams.get('project') || DEFAULT_PROJECT_PATH;

  // Try to read from manifest first
  let manifest = readManifest(projectPath);

  // If no manifest or empty, scan directories
  if (!manifest || Object.keys(manifest.datasets).length === 0) {
    const scannedDatasets = scanDataDirectories(projectPath);
    const datasetsRecord: Record<string, DatasetInfo> = {};
    for (const dataset of scannedDatasets) {
      datasetsRecord[dataset.id] = dataset;
    }

    manifest = {
      project_id: path.basename(projectPath),
      datasets: datasetsRecord,
      models: {},
      last_updated: new Date().toISOString(),
    };
  }

  return NextResponse.json(manifest);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, projectPath: bodyProjectPath, dataset } = body;
  const projectPath = bodyProjectPath || DEFAULT_PROJECT_PATH;

  let manifest = readManifest(projectPath);

  if (!manifest) {
    manifest = {
      project_id: path.basename(projectPath),
      datasets: {},
      models: {},
      last_updated: new Date().toISOString(),
    };
  }

  switch (action) {
    case 'register':
      if (!dataset || !dataset.id) {
        return NextResponse.json({ error: 'dataset with id is required' }, { status: 400 });
      }
      manifest.datasets[dataset.id] = {
        ...dataset,
        created_at: dataset.created_at || new Date().toISOString(),
      };
      break;

    case 'validate':
      if (!dataset?.id) {
        return NextResponse.json({ error: 'dataset.id is required' }, { status: 400 });
      }
      if (manifest.datasets[dataset.id]) {
        manifest.datasets[dataset.id].validated = true;
        manifest.datasets[dataset.id].validation_report = dataset.validation_report;
      }
      break;

    case 'remove':
      if (!dataset?.id) {
        return NextResponse.json({ error: 'dataset.id is required' }, { status: 400 });
      }
      delete manifest.datasets[dataset.id];
      break;

    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }

  // Write updated manifest
  manifest.last_updated = new Date().toISOString();
  const manifestPath = path.join(projectPath, '.factory', 'data-manifest.json');
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  return NextResponse.json({ success: true, manifest });
}
