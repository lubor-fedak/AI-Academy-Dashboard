import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { github_username, name, email, role, team, stream, avatar_url } = body;

    // Validate required fields
    if (!github_username || !name || !email || !role || !team || !stream) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const supabase = createServiceSupabaseClient();

    // Check if username or email already exists
    const { data: existing } = await supabase
      .from('participants')
      .select('id')
      .or(`github_username.eq.${github_username},email.eq.${email}`)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Username or email already registered' },
        { status: 409 }
      );
    }

    // Use provided avatar_url or fetch from GitHub
    let avatarUrl = avatar_url || null;
    if (!avatarUrl) {
      try {
        const ghResponse = await fetch(`https://api.github.com/users/${github_username}`);
        if (ghResponse.ok) {
          const ghData = await ghResponse.json();
          avatarUrl = ghData.avatar_url;
        }
      } catch {
        // Ignore avatar fetch errors
      }
    }

    // Insert participant
    const { data: participant, error } = await supabase
      .from('participants')
      .insert({
        github_username,
        name,
        email,
        role,
        team,
        stream,
        avatar_url: avatarUrl,
        repo_url: `https://github.com/${github_username}/ai-academy-2026`,
      })
      .select()
      .single();

    if (error) {
      console.error('Registration error:', error);
      return NextResponse.json(
        { error: 'Registration failed' },
        { status: 500 }
      );
    }

    // Initialize leaderboard entry
    await supabase.from('leaderboard').insert({
      participant_id: participant.id,
      total_points: 0,
      total_submissions: 0,
      on_time_submissions: 0,
      current_streak: 0,
      rank: null,
    });

    return NextResponse.json({
      success: true,
      participant_id: participant.id,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
