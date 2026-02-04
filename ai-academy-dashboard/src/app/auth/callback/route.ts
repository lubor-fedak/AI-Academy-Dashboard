import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createServiceSupabaseClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

/**
 * Validate redirect path to prevent open redirect attacks.
 * Only allows relative paths starting with / and not containing protocol schemes.
 */
function isSafeRedirect(path: string): boolean {
  // Must start with single slash (not //)
  if (!path.startsWith('/') || path.startsWith('//')) {
    return false;
  }
  // Must not contain protocol scheme
  if (path.includes('://')) {
    return false;
  }
  // Must not contain backslashes (potential bypass)
  if (path.includes('\\')) {
    return false;
  }
  return true;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const nextParam = requestUrl.searchParams.get('next');
  const next = nextParam && isSafeRedirect(nextParam) ? nextParam : '/my-dashboard';

  if (code) {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const serviceSupabase = createServiceSupabaseClient();
      const githubUsername = data.user.user_metadata?.user_name;
      const userEmail = data.user.email;

      // Try to find participant by multiple identifiers
      let participant = null;

      // First try by auth_user_id
      const { data: byAuthId } = await serviceSupabase
        .from('participants')
        .select('id, github_username')
        .eq('auth_user_id', data.user.id)
        .single();

      if (byAuthId) {
        participant = byAuthId;
      }

      // If not found, try by email
      if (!participant && userEmail) {
        const { data: byEmail } = await serviceSupabase
          .from('participants')
          .select('id, github_username, auth_user_id')
          .eq('email', userEmail)
          .single();

        if (byEmail) {
          participant = byEmail;
          // Link auth_user_id if not set
          if (!byEmail.auth_user_id) {
            await serviceSupabase
              .from('participants')
              .update({
                auth_user_id: data.user.id,
                github_username: githubUsername || byEmail.github_username
              })
              .eq('id', byEmail.id);
          }
        }
      }

      // If not found, try by github_username
      if (!participant && githubUsername) {
        const { data: byGithub } = await serviceSupabase
          .from('participants')
          .select('id, auth_user_id')
          .eq('github_username', githubUsername)
          .single();

        if (byGithub) {
          participant = byGithub;
          // Link auth_user_id if not set
          if (!byGithub.auth_user_id) {
            await serviceSupabase
              .from('participants')
              .update({ auth_user_id: data.user.id })
              .eq('id', byGithub.id);
          }
        }
      }

      if (!participant) {
        // No participant found - redirect to onboarding
        return NextResponse.redirect(
          new URL('/onboarding?from=github', requestUrl.origin)
        );
      }

      // Update avatar and github_username if changed
      const updates: Record<string, string> = {};
      if (data.user.user_metadata?.avatar_url) {
        updates.avatar_url = data.user.user_metadata.avatar_url;
      }
      if (githubUsername) {
        updates.github_username = githubUsername;
      }

      if (Object.keys(updates).length > 0) {
        await serviceSupabase
          .from('participants')
          .update(updates)
          .eq('id', participant.id);
      }

      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  // Return to login with error
  return NextResponse.redirect(
    new URL('/login?error=auth_failed', requestUrl.origin)
  );
}
