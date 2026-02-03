import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import fs from 'fs/promises';
import path from 'path';
import { VALID_ROLES } from '@/lib/validation';

// In-memory cache for content
const contentCache = new Map<string, { data: ContentResponse; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// GitHub configuration
const GITHUB_OWNER = process.env.GITHUB_CONTENT_OWNER || 'luborfedak';
const GITHUB_REPO = process.env.GITHUB_CONTENT_REPO || 'ai-academy';
const GITHUB_BRANCH = process.env.GITHUB_CONTENT_BRANCH || 'main';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Local content path for development
const LOCAL_CONTENT_PATH = process.env.LOCAL_CONTENT_PATH || '/Users/luborfedak/Documents/GitHub/ai-academy';

interface ContentResponse {
  day: number;
  situation: string | null;
  resources: string | null;
  mentorNotes: string | null;
  source: 'local' | 'github' | 'database';
  cached: boolean;
  phase: 'common' | 'role-specific' | 'team-project';
}

// Day folder mappings for Common Foundations (Days 1-3)
const COMMON_FOUNDATION_FOLDERS: Record<number, string> = {
  1: 'Day-01-AI-Landscape',
  2: 'Day-02-Prompt-Engineering',
  3: 'Day-03-Agentic-Patterns',
};

// Lab mappings for Team Project phase (Days 11-25)
// Maps day number to lab folder
const LAB_FOLDERS: Record<number, string> = {
  11: 'Lab-01-First-Chatbot',
  12: 'Lab-01-First-Chatbot',
  13: 'Lab-02-RAG-Pipeline',
  14: 'Lab-02-RAG-Pipeline',
  15: 'Lab-03-Multi-Agent',
  16: 'Lab-03-Multi-Agent',
  17: 'Lab-04-Deployment',
  18: 'Lab-04-Deployment',
  19: 'Lab-05-Evaluation',
  20: 'Lab-05-Evaluation',
  21: 'Lab-06-Security',
  22: 'Lab-06-Security',
  23: 'Lab-07-Dashboard',
  24: 'Lab-08-UI-Prototype',
  25: 'Lab-08-UI-Prototype',
};

// Helper to format day number with leading zero
function formatDay(day: number): string {
  return day.toString().padStart(2, '0');
}

// Get the week number for role-specific days (4-10)
function getWeekForDay(day: number): number {
  if (day >= 4 && day <= 5) return 1;
  if (day >= 6 && day <= 10) return 2;
  return 0;
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

// Get content path based on day number
function getContentPath(day: number): { basePath: string; phase: 'common' | 'role-specific' | 'team-project' } {
  if (day >= 1 && day <= 3) {
    // Common Foundations phase
    const folder = COMMON_FOUNDATION_FOLDERS[day];
    return {
      basePath: path.join(LOCAL_CONTENT_PATH, '01-Common-Foundations', folder),
      phase: 'common',
    };
  } else if (day >= 4 && day <= 10) {
    // Role-specific phase - returns base path without role, role will be added by caller
    return {
      basePath: path.join(LOCAL_CONTENT_PATH, '02-Role-Tracks'),
      phase: 'role-specific',
    };
  } else {
    // Team project phase (Labs)
    const labFolder = LAB_FOLDERS[day] || 'Lab-01-First-Chatbot';
    return {
      basePath: path.join(LOCAL_CONTENT_PATH, '03-Labs', labFolder),
      phase: 'team-project',
    };
  }
}

// Get content from local filesystem
async function getLocalContent(day: number, isAdmin: boolean, userRole?: string): Promise<ContentResponse | null> {
  const { basePath, phase } = getContentPath(day);

  let situationPath: string;
  let resourcesPath: string;
  let mentorPath: string;

  if (phase === 'common') {
    // Common Foundations: SITUATION.md, RESOURCES.md, MENTOR-NOTES.md
    situationPath = path.join(basePath, 'SITUATION.md');
    resourcesPath = path.join(basePath, 'RESOURCES.md');
    mentorPath = path.join(basePath, 'MENTOR-NOTES.md');
  } else if (phase === 'role-specific') {
    // Role-specific: 02-Role-Tracks/{Role}/Week-XX/Day-XX/
    const safeRole =
      userRole && VALID_ROLES.includes(userRole as (typeof VALID_ROLES)[number])
        ? userRole
        : 'FDE'; // Default to FDE if no valid role specified
    const week = getWeekForDay(day);
    const dayFolder = `Day-${formatDay(day)}`;
    const rolePath = path.join(basePath, safeRole, `Week-${formatDay(week)}`, dayFolder);

    situationPath = path.join(rolePath, 'SITUATION.md');
    resourcesPath = path.join(rolePath, 'RESOURCES.md');
    mentorPath = path.join(rolePath, 'MENTOR-NOTES.md');
  } else {
    // Team project (Labs): README.md, INSTRUCTIONS.md, MENTOR-NOTES.md
    situationPath = path.join(basePath, 'README.md');
    resourcesPath = path.join(basePath, 'INSTRUCTIONS.md');
    mentorPath = path.join(basePath, 'MENTOR-NOTES.md');
  }

  const situation = await readLocalFile(situationPath);
  const resources = await readLocalFile(resourcesPath);
  const mentorNotes = isAdmin ? await readLocalFile(mentorPath) : null;

  // Only return if at least situation file exists
  if (situation) {
    return {
      day,
      situation,
      resources,
      mentorNotes,
      source: 'local',
      cached: false,
      phase,
    };
  }

  return null;
}

// Get GitHub content path based on day number
function getGitHubContentPath(day: number, userRole?: string): { basePath: string; phase: 'common' | 'role-specific' | 'team-project'; situationFile: string; resourcesFile: string; mentorFile: string } {
  if (day >= 1 && day <= 3) {
    const folder = COMMON_FOUNDATION_FOLDERS[day];
    const basePath = `01-Common-Foundations/${folder}`;
    return {
      basePath,
      phase: 'common',
      situationFile: 'SITUATION.md',
      resourcesFile: 'RESOURCES.md',
      mentorFile: 'MENTOR-NOTES.md',
    };
  } else if (day >= 4 && day <= 10) {
    const role = userRole || 'FDE';
    const week = getWeekForDay(day);
    const basePath = `02-Role-Tracks/${role}/Week-${formatDay(week)}/Day-${formatDay(day)}`;
    return {
      basePath,
      phase: 'role-specific',
      situationFile: 'SITUATION.md',
      resourcesFile: 'RESOURCES.md',
      mentorFile: 'MENTOR-NOTES.md',
    };
  } else {
    const labFolder = LAB_FOLDERS[day] || 'Lab-01-First-Chatbot';
    const basePath = `03-Labs/${labFolder}`;
    return {
      basePath,
      phase: 'team-project',
      situationFile: 'README.md',
      resourcesFile: 'INSTRUCTIONS.md',
      mentorFile: 'MENTOR-NOTES.md',
    };
  }
}

// Get content from GitHub API
async function getGitHubContent(day: number, isAdmin: boolean, userRole?: string): Promise<ContentResponse | null> {
  const { basePath, phase, situationFile, resourcesFile, mentorFile } = getGitHubContentPath(day, userRole);

  const situation = await fetchFromGitHub(`${basePath}/${situationFile}`);
  const resources = await fetchFromGitHub(`${basePath}/${resourcesFile}`);
  const mentorNotes = isAdmin ? await fetchFromGitHub(`${basePath}/${mentorFile}`) : null;

  // Only return if at least situation file exists
  if (situation) {
    return {
      day,
      situation,
      resources,
      mentorNotes,
      source: 'github',
      cached: false,
      phase,
    };
  }

  return null;
}

// Determine phase from day number
function getPhaseForDay(day: number): 'common' | 'role-specific' | 'team-project' {
  if (day >= 1 && day <= 3) return 'common';
  if (day >= 4 && day <= 10) return 'role-specific';
  return 'team-project';
}

// Get content from database as fallback
async function getDatabaseContent(day: number): Promise<ContentResponse | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('mission_days')
      .select('briefing_content, resources_content')
      .eq('day', day)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      day,
      situation: data.briefing_content,
      resources: data.resources_content,
      mentorNotes: null,
      source: 'database',
      cached: false,
      phase: getPhaseForDay(day),
    };
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const day = parseInt(id, 10);

  if (isNaN(day) || day < 1 || day > 25) {
    return NextResponse.json(
      { error: 'Invalid day. Must be between 1 and 25.' },
      { status: 400 }
    );
  }

  // Check if user is admin/instructor and get their role
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let isAdmin = false;
  let userRole: string | undefined;

  if (user) {
    const { data: participant } = await supabase
      .from('participants')
      .select('is_admin, role')
      .eq('email', user.email)
      .single();
    isAdmin = participant?.is_admin ?? false;
    userRole = participant?.role ?? undefined;
  }

  // Check cache first (include role in cache key for role-specific days)
  const cacheKey = `day-${day}-admin-${isAdmin}-role-${userRole || 'none'}`;
  const cached = contentCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json({ ...cached.data, cached: true });
  }

  // Try sources in order: local, GitHub, database
  let content: ContentResponse | null = null;

  // 1. Try local filesystem (development)
  content = await getLocalContent(day, isAdmin, userRole);

  // 2. Try GitHub API
  if (!content) {
    content = await getGitHubContent(day, isAdmin, userRole);
  }

  // 3. Fallback to database
  if (!content) {
    content = await getDatabaseContent(day);
  }

  // Return error if no content found
  if (!content) {
    return NextResponse.json(
      { error: 'Content not found for this day.' },
      { status: 404 }
    );
  }

  // Cache the result
  contentCache.set(cacheKey, { data: content, timestamp: Date.now() });

  return NextResponse.json(content);
}
