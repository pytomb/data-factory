import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

// Default project path
const DEFAULT_PROJECT_PATH = process.env.DATA_FACTORY_PROJECT_PATH ||
  path.join(process.cwd(), '..', '..', 'projects', 'ellembelle-education');

// Allowed file extensions for security
const ALLOWED_EXTENSIONS = [
  '.md', '.json', '.jsonl', '.txt', '.yaml', '.yml',
  '.ts', '.tsx', '.js', '.jsx', '.py', '.csv',
];

export async function GET(request: NextRequest) {
  const filePath = request.nextUrl.searchParams.get('path');
  const projectPath = request.nextUrl.searchParams.get('project') || DEFAULT_PROJECT_PATH;

  if (!filePath) {
    return NextResponse.json(
      { error: 'path parameter is required' },
      { status: 400 }
    );
  }

  // Security: Prevent path traversal
  const normalizedPath = path.normalize(filePath);
  if (normalizedPath.includes('..')) {
    return NextResponse.json(
      { error: 'Invalid path: path traversal not allowed' },
      { status: 400 }
    );
  }

  // Check file extension
  const ext = path.extname(normalizedPath).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json(
      { error: `File type not allowed: ${ext}` },
      { status: 400 }
    );
  }

  const fullPath = path.join(projectPath, normalizedPath);

  // Security: Ensure file is within project directory
  if (!fullPath.startsWith(path.resolve(projectPath))) {
    return NextResponse.json(
      { error: 'Access denied: file outside project directory' },
      { status: 403 }
    );
  }

  try {
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      // List directory contents
      const files = fs.readdirSync(fullPath);
      return NextResponse.json({
        type: 'directory',
        path: normalizedPath,
        files: files.map(f => ({
          name: f,
          isDirectory: fs.statSync(path.join(fullPath, f)).isDirectory(),
        })),
      });
    }

    // Check file size (max 1MB)
    if (stat.size > 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large (max 1MB)' },
        { status: 400 }
      );
    }

    const content = fs.readFileSync(fullPath, 'utf-8');

    return NextResponse.json({
      type: 'file',
      path: normalizedPath,
      content,
      size: stat.size,
      modified: stat.mtime.toISOString(),
    });
  } catch (error) {
    console.error('File read error:', error);
    return NextResponse.json(
      { error: 'Failed to read file', details: String(error) },
      { status: 500 }
    );
  }
}
