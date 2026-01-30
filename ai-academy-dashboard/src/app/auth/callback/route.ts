import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/my-dashboard';

  if (code) {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Check if participant exists, if not redirect to complete registration
      const { data: participant } = await supabase
        .from('participants')
        .select('id')
        .eq('github_username', data.user.user_metadata.user_name)
        .single();

      if (!participant) {
        // Redirect to onboarding wizard with GitHub data pre-filled
        return NextResponse.redirect(
          new URL('/onboarding?from=github', requestUrl.origin)
        );
      }

      // Update avatar if changed
      if (data.user.user_metadata.avatar_url) {
        await supabase
          .from('participants')
          .update({ avatar_url: data.user.user_metadata.avatar_url })
          .eq('github_username', data.user.user_metadata.user_name);
      }

      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  // Return to login with error
  return NextResponse.redirect(
    new URL('/login?error=auth_failed', requestUrl.origin)
  );
}
