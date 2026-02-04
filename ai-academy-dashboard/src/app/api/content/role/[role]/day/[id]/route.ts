import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// In-memory cache for role-specific content
const roleContentCache = new Map<string, { data: RoleContentResponse; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// GitHub configuration - no hardcoded defaults for security
const GITHUB_OWNER = process.env.GITHUB_CONTENT_OWNER || '';
const GITHUB_REPO = process.env.GITHUB_CONTENT_REPO || '';
const GITHUB_BRANCH = process.env.GITHUB_CONTENT_BRANCH || 'main';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Local content path for development - no hardcoded paths
const LOCAL_CONTENT_PATH = process.env.LOCAL_CONTENT_PATH || '';

// Valid roles
const VALID_ROLES = ['AI-SE', 'AI-FE', 'AI-PM', 'AI-DA', 'AI-DS', 'AI-SEC', 'FDE'];

interface RoleContentResponse {
  day: number;
  role: string;
  content: string | null;
  source: 'local' | 'github' | 'fallback';
  cached: boolean;
  hasFallback: boolean;
}

// Helper to format day number with leading zero
function formatDay(day: number): string {
  return day.toString().padStart(2, '0');
}

// Try to read file from local filesystem
async function readLocalFile(filePath: string): Promise<string | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch {
    return null;
  }
}

// Try to fetch file from GitHub API
async function fetchFromGitHub(filePath: string): Promise<string | null> {
  if (!GITHUB_TOKEN) {
    return null;
  }

  try {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}?ref=${GITHUB_BRANCH}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3.raw',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.text();
  } catch {
    return null;
  }
}

// Get role-specific content from local filesystem
async function getLocalRoleContent(day: number, role: string): Promise<{ content: string | null; source: 'local' | 'github' | 'fallback' }> {
  const dayFolder = `Day-${formatDay(day)}`;

  // Try role-specific path first
  const roleSpecificPath = path.join(LOCAL_CONTENT_PATH, '02-Role-Specific', role, dayFolder, 'ROLE-SPECIFIC.md');
  let content = await readLocalFile(roleSpecificPath);

  if (content) {
    return { content, source: 'local' };
  }

  // Fallback to common foundations content
  const commonPath = path.join(LOCAL_CONTENT_PATH, '01-Common-Foundations', dayFolder, 'SITUATION.md');
  content = await readLocalFile(commonPath);

  return { content, source: 'fallback' };
}

// Get role-specific content from GitHub
async function getGitHubRoleContent(day: number, role: string): Promise<{ content: string | null; source: 'local' | 'github' | 'fallback' }> {
  const dayFolder = `Day-${formatDay(day)}`;

  // Try role-specific path first
  const roleSpecificPath = `02-Role-Specific/${role}/${dayFolder}/ROLE-SPECIFIC.md`;
  let content = await fetchFromGitHub(roleSpecificPath);

  if (content) {
    return { content, source: 'github' };
  }

  // Fallback to common foundations content
  const commonPath = `01-Common-Foundations/${dayFolder}/SITUATION.md`;
  content = await fetchFromGitHub(commonPath);

  return { content, source: 'fallback' };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ role: string; id: string }> }
) {
  const { role, id } = await params;
  const day = parseInt(id, 10);
  const normalizedRole = role.toUpperCase();

  // Validate role
  if (!VALID_ROLES.includes(normalizedRole)) {
    return NextResponse.json(
      { error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` },
      { status: 400 }
    );
  }

  // Validate day
  if (isNaN(day) || day < 1 || day > 25) {
    return NextResponse.json(
      { error: 'Invalid day. Must be between 1 and 25.' },
      { status: 400 }
    );
  }

  // Check cache first
  const cacheKey = `role-${normalizedRole}-day-${day}`;
  const cached = roleContentCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json({ ...cached.data, cached: true });
  }

  // Try sources in order: local, GitHub
  let result: { content: string | null; source: 'local' | 'github' | 'fallback' };

  // 1. Try local filesystem (development)
  result = await getLocalRoleContent(day, normalizedRole);

  // 2. Try GitHub API if local didn't find anything
  if (!result.content || result.source === 'fallback') {
    const githubResult = await getGitHubRoleContent(day, normalizedRole);
    if (githubResult.content && githubResult.source !== 'fallback') {
      result = githubResult;
    } else if (!result.content && githubResult.content) {
      result = githubResult;
    }
  }

  // Return error if no content found at all
  if (!result.content) {
    return NextResponse.json(
      { error: 'Content not found for this role and day.' },
      { status: 404 }
    );
  }

  const response: RoleContentResponse = {
    day,
    role: normalizedRole,
    content: result.content,
    source: result.source,
    cached: false,
    hasFallback: result.source === 'fallback',
  };

  // Cache the result
  roleContentCache.set(cacheKey, { data: response, timestamp: Date.now() });

  return NextResponse.json(response);
}
