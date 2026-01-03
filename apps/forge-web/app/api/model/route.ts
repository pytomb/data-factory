import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

// Default project path
const DEFAULT_PROJECT_PATH = process.env.DATA_FACTORY_PROJECT_PATH ||
  path.join(process.cwd(), '..', '..', 'projects', 'ellembelle-education');

interface ModelInfo {
  id: string;
  name: string;
  path: string;
  base_model: string;
  checkpoint: string;
  quantization?: string;
  metrics?: Record<string, number>;
  created_at: string;
  deployed: boolean;
  registry_url?: string;
}

interface DataManifest {
  project_id: string;
  datasets: Record<string, unknown>;
  models: Record<string, ModelInfo>;
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

function readMetricsFile(projectPath: string, filename: string): Record<string, number> | null {
  const metricsPath = path.join(projectPath, 'metrics', filename);

  if (!fs.existsSync(metricsPath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(metricsPath, 'utf-8'));
  } catch {
    return null;
  }
}

function scanModels(projectPath: string): ModelInfo[] {
  const models: ModelInfo[] = [];
  const modelsDir = path.join(projectPath, 'models');

  if (!fs.existsSync(modelsDir)) {
    return models;
  }

  // Check checkpoints directory
  const checkpointsDir = path.join(modelsDir, 'checkpoints');
  if (fs.existsSync(checkpointsDir)) {
    try {
      const checkpoints = fs.readdirSync(checkpointsDir, { withFileTypes: true });
      for (const checkpoint of checkpoints) {
        if (checkpoint.isDirectory()) {
          const configPath = path.join(checkpointsDir, checkpoint.name, 'config.json');
          let baseModel = 'unknown';

          if (fs.existsSync(configPath)) {
            try {
              const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
              baseModel = config._name_or_path || config.model_type || 'unknown';
            } catch {
              // Ignore config read errors
            }
          }

          // Try to load metrics
          const metrics = readMetricsFile(projectPath, 'evaluation.json') ||
                         readMetricsFile(projectPath, `${checkpoint.name}.json`);

          models.push({
            id: checkpoint.name,
            name: checkpoint.name,
            path: `models/checkpoints/${checkpoint.name}`,
            base_model: baseModel,
            checkpoint: checkpoint.name,
            metrics: metrics || undefined,
            created_at: fs.statSync(path.join(checkpointsDir, checkpoint.name)).birthtime.toISOString(),
            deployed: false,
          });
        }
      }
    } catch (e) {
      console.error('Error scanning checkpoints:', e);
    }
  }

  // Check quantized directory
  const quantizedDir = path.join(modelsDir, 'quantized');
  if (fs.existsSync(quantizedDir)) {
    try {
      const quantizedModels = fs.readdirSync(quantizedDir, { withFileTypes: true });
      for (const qModel of quantizedModels) {
        if (qModel.isDirectory() || qModel.name.endsWith('.gguf')) {
          const isFile = !qModel.isDirectory();
          const modelPath = isFile
            ? `models/quantized/${qModel.name}`
            : `models/quantized/${qModel.name}`;

          // Check for registry info
          const registryInfoPath = path.join(projectPath, 'docs', 'registry-info.md');
          let registryUrl: string | undefined;
          if (fs.existsSync(registryInfoPath)) {
            const registryContent = fs.readFileSync(registryInfoPath, 'utf-8');
            const urlMatch = registryContent.match(/huggingface\.co\/[^\s]+/);
            if (urlMatch) {
              registryUrl = `https://${urlMatch[0]}`;
            }
          }

          models.push({
            id: `quantized-${qModel.name}`,
            name: `${qModel.name} (quantized)`,
            path: modelPath,
            base_model: 'quantized',
            checkpoint: qModel.name,
            quantization: qModel.name.includes('4bit') ? '4-bit' : qModel.name.includes('8bit') ? '8-bit' : 'unknown',
            created_at: fs.statSync(path.join(quantizedDir, qModel.name)).birthtime.toISOString(),
            deployed: !!registryUrl,
            registry_url: registryUrl,
          });
        }
      }
    } catch (e) {
      console.error('Error scanning quantized models:', e);
    }
  }

  return models;
}

export async function GET(request: NextRequest) {
  const projectPath = request.nextUrl.searchParams.get('project') || DEFAULT_PROJECT_PATH;

  // Try to read from manifest first
  const manifest = readManifest(projectPath);
  let models: ModelInfo[] = [];

  if (manifest && Object.keys(manifest.models).length > 0) {
    models = Object.values(manifest.models);
  } else {
    // Scan model directories
    models = scanModels(projectPath);
  }

  return NextResponse.json({ models });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, projectPath: bodyProjectPath, model } = body;
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
      if (!model || !model.id) {
        return NextResponse.json({ error: 'model with id is required' }, { status: 400 });
      }
      manifest.models[model.id] = {
        ...model,
        created_at: model.created_at || new Date().toISOString(),
      };
      break;

    case 'update_metrics':
      if (!model?.id || !model?.metrics) {
        return NextResponse.json({ error: 'model.id and model.metrics are required' }, { status: 400 });
      }
      if (manifest.models[model.id]) {
        manifest.models[model.id].metrics = {
          ...manifest.models[model.id].metrics,
          ...model.metrics,
        };
      }
      break;

    case 'deploy':
      if (!model?.id) {
        return NextResponse.json({ error: 'model.id is required' }, { status: 400 });
      }
      if (manifest.models[model.id]) {
        manifest.models[model.id].deployed = true;
        if (model.registry_url) {
          manifest.models[model.id].registry_url = model.registry_url;
        }
      }
      break;

    case 'remove':
      if (!model?.id) {
        return NextResponse.json({ error: 'model.id is required' }, { status: 400 });
      }
      delete manifest.models[model.id];
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
