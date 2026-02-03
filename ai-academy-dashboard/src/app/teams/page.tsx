import { createServerSupabaseClient } from '@/lib/supabase-server';
import { TeamCard } from '@/components/TeamCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import type { Participant, TeamType, TeamProgress } from '@/lib/types';

export const revalidate = 0;

const TEAMS: TeamType[] = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta'];

export default async function TeamsPage() {
  const supabase = await createServerSupabaseClient();

  // Fetch all participants
  const { data: participants } = await supabase
    .from('public_participants')
    .select('*');

  // Fetch team progress
  const { data: teamProgress } = await supabase
    .from('team_progress')
    .select('*')
    .order('team_points', { ascending: false });

  // Group participants by team
  const participantsByTeam = new Map<TeamType, Participant[]>();
  TEAMS.forEach((team) => participantsByTeam.set(team, []));
  
  (participants as Participant[] ?? []).forEach((p) => {
    // Skip participants without a team assigned
    if (!p.team) return;
    const teamMembers = participantsByTeam.get(p.team) ?? [];
    teamMembers.push(p);
    participantsByTeam.set(p.team, teamMembers);
  });

  // Create team progress map
  const progressByTeam = new Map<TeamType, TeamProgress>();
  (teamProgress as TeamProgress[] ?? []).forEach((tp, index) => {
    progressByTeam.set(tp.team, { ...tp, rank: index + 1 } as TeamProgress & { rank: number });
  });

  // Get max points for bar chart scaling
  const maxPoints = Math.max(...(teamProgress as TeamProgress[] ?? []).map((t) => t.team_points), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Teams</h1>
        <p className="text-muted-foreground">
          Team standings, members, and comparison
        </p>
      </div>

      {/* Team Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#0062FF]" />
            Team Points Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(teamProgress as (TeamProgress & { rank?: number })[] ?? []).map((team, index) => {
              const percentage = (team.team_points / maxPoints) * 100;
              return (
                <div key={team.team} className="flex items-center gap-4">
                  <div className="w-20 text-sm font-medium">{team.team}</div>
                  <div className="flex-1 h-8 bg-accent/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0062FF] rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                      style={{ width: `${Math.max(percentage, 10)}%` }}
                    >
                      <span className="text-xs font-medium text-white">
                        {team.team_points} pts
                      </span>
                    </div>
                  </div>
                  <div className="w-12 text-right">
                    {index === 0 && '🥇'}
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                    {index > 2 && `#${index + 1}`}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Team Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {TEAMS.map((team) => {
          const members = participantsByTeam.get(team) ?? [];
          const progress = progressByTeam.get(team);
          const rank = (teamProgress as TeamProgress[] ?? []).findIndex((t) => t.team === team) + 1;

          return (
            <TeamCard
              key={team}
              team={team}
              members={members}
              totalPoints={progress?.team_points ?? 0}
              avgSubmissions={progress?.avg_submissions ?? 0}
              rank={rank || TEAMS.indexOf(team) + 1}
            />
          );
        })}
      </div>
    </div>
  );
}
