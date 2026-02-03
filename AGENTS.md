# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

The AI Academy Dashboard is a learning management and progress tracking system for the Kyndryl AI Academy program. It consists of two main components:
- **ai-academy-dashboard**: Backend and webhook infrastructure for capturing student submissions via GitHub
- **ai-academy-student-template**: Template repository that students fork to submit their daily assignments

The system uses GitHub webhooks to automatically capture push events from student repositories, parses submissions from structured README files, stores data in Supabase, and displays leaderboards and progress matrices.

## Architecture

### Data Flow
1. **Student Push** → GitHub webhook triggers
2. **Webhook Handler** (`ai-academy-dashboard/api/webhook/github.ts`) → Validates signature, detects submission folder, fetches README
3. **Supabase** → Stores submissions, updates leaderboard materialized view, awards achievements
4. **Frontend** → Displays leaderboard, progress matrix, team stats, activity feed

### Key Components
- **Webhook Handler** (`github.ts`): Verifies GitHub signatures, detects which assignment folder was updated, parses self-ratings from README HTML comments, calculates points (base + on-time bonus), and triggers achievement logic
- **Database Schema** (`supabase-schema.sql`): 
  - Core tables: `participants`, `assignments`, `submissions`, `achievements`, `leaderboard`
  - Materialized views for leaderboard ranking and progress metrics
  - Triggers for automatic leaderboard updates and activity logging
  - RLS policies for public read access to progress data

### Assignment Detection
The system detects submissions by looking for predefined folder names in modified files:
- In-class: `day-01-agent-foundations`, `day-02-rag-basics`, etc.
- Homework: `homework/day-01`, `homework/day-02`, etc.

Each assignment maps to a unique folder in the schema.

### Self-Rating & Metadata Parsing
Student submissions must include an HTML comment in their README marking the submission:
```html
<!-- submission:day-01:in-class -->
<!-- OR -->
<!-- submission:day-01:homework -->
```

Self-ratings are parsed from:
```
**Overall rating:** X/5
```

### Achievement System
Achievements are automatically awarded based on submission patterns:
- **First Blood**: First submission
- **Early Bird/Night Owl**: Submission time-based
- **Streak**: 3+ or 5+ consecutive days with submissions
- **Team Player/Mentor Favorite**: Team or rating-based
- **Completionist**: All assignments submitted

## Common Tasks

### Adding a New Assignment
1. Update `supabase-schema.sql` seed data with new assignment folder name
2. Update `github.ts` `submissionFolders` array with new folder name
3. Ensure assignment tuple is inserted into `assignments` table with correct `day`, `type`, and `folder_name`

### Updating Webhook Logic
The webhook handler validates GitHub signatures, detects assignment folders, and calculates points. When modifying:
- Signature verification must remain unchanged for security
- Assignment folder detection uses startsWith matching on file paths
- Points calculation: base points with 50% penalty for late submissions
- Achievement logic checks submission count and timestamp patterns

### Debugging Webhook Issues
- Check webhook deliveries in GitHub Settings → Webhooks → Recent Deliveries
- Verify `GITHUB_WEBHOOK_SECRET` is set correctly in environment
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are valid
- Check Supabase logs for database errors during upsert

### Database Queries
Common queries often need to join:
- `submissions` with `participants` for attribution
- `submissions` with `assignments` for assignment metadata
- `leaderboard` with `participants` for full leaderboard view
- RLS is enabled but policies allow public SELECT on read-heavy tables

## File Locations & Purpose

- `supabase-schema.sql` - Database schema with enums, tables, triggers, views, and seed data
- `github.ts` - Webhook handler for processing push events (also at `ai-academy-dashboard/api/webhook/github.ts`)
- `dashboard-architecture.mermaid` - Architecture diagram showing data flow
- `STUDENT-SETUP.md` - Onboarding guide for students (duplicated in `ai-academy-dashboard/docs/`)
- `ai-academy-student-template/` - Template repository structure students fork
- `ai-academy-dashboard/api/webhook/` - Vercel Edge Functions directory

## Key Technical Decisions

1. **Webhook-driven approach**: Real-time capture of student activity without polling
2. **Supabase materialized view for leaderboard**: Efficient ranking without recalculation on every query
3. **Folder-based assignment detection**: Simple, doesn't require changes to student workflow
4. **README parsing for metadata**: Self-ratings extracted from student submission documents
5. **Achievement triggers on submission insert**: Automatic badge awarding without separate cron job
6. **Activity log JSONB**: Flexible event tracking for future analytics

## Important Notes

- GitHub webhook secret must be strong; changes require updating webhook in all student repos
- RLS is enabled but currently allows public read for most tables (leaderboard, submissions, activity) - this is intentional for transparency
- Supabase Row Level Security uses `true` policies for public data to keep leaderboard public
- Assignment points on late submissions are reduced to 50% of max points
- The system assumes student repos follow the naming convention `ai-academy-2026`
