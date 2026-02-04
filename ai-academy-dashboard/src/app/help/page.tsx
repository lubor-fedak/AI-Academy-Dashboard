'use client';

import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard,
  Target,
  Zap,
  Radio,
  User,
  UsersRound,
  Trophy,
  Grid3X3,
  Users,
  BarChart3,
  HelpCircle,
  Loader2,
  BookOpen,
  Rocket,
  Settings,
} from 'lucide-react';

const helpSections = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Rocket,
    content: `
Welcome to AI Academy! This platform is designed to help you learn and develop AI skills through a structured program. Here's how to get the most out of your learning experience:

**Your Journey:**
1. Complete your profile during onboarding
2. Follow daily missions and assignments
3. Submit your work and get feedback
4. Track your progress on the leaderboard
5. Collaborate with your team members

**Tips for Success:**
- Check the platform daily for new content and intel drops
- Submit assignments on time to maintain your streak
- Participate in peer reviews to learn from others
- Use the search function (⌘K) to quickly navigate
    `,
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: LayoutDashboard,
    content: `
The Dashboard is your home base in AI Academy. It provides an overview of your current status and important information.

**What You'll Find:**
- **Statistics**: Quick view of total participants, submissions, and completion rates
- **Upcoming Deadlines**: Assignments that are due soon
- **Activity Feed**: Recent submissions and achievements from all participants
- **Quick Links**: Fast access to your most-used features

**How to Use:**
- Review the activity feed to stay updated on what others are doing
- Check upcoming deadlines to plan your work
- Use quick links to navigate to frequently used sections
    `,
  },
  {
    id: 'mission',
    title: 'Mission',
    icon: Target,
    content: `
The Mission section contains your daily learning content and assignments. This is where you'll spend most of your time.

**Structure:**
- The program is organized into daily missions
- Each day has specific learning objectives and tasks
- Missions are released according to the program schedule

**Types of Content:**
- **Briefings**: Daily overview and learning objectives
- **In-Class Assignments**: Tasks to complete during sessions
- **Homework**: Additional practice to reinforce learning
- **Resources**: Supporting materials and references

**Submitting Work:**
1. Complete the assignment following the instructions
2. Push your code to your GitHub repository (if applicable)
3. The system automatically tracks your submissions
4. Review feedback from mentors and peers
    `,
  },
  {
    id: 'intel',
    title: 'Intel',
    icon: Zap,
    content: `
Intel drops are special announcements and updates that provide important information during the program.

**What Intel Contains:**
- Program updates and announcements
- Special challenges or bonus opportunities
- Industry insights and news
- Tips and best practices

**How It Works:**
- Intel drops are released at scheduled times
- You'll receive a notification when new intel is available
- A badge shows the number of unread intel items
- Read intel carefully as it may contain important instructions

**Staying Updated:**
- Check the Intel section regularly
- Pay attention to notification badges
- Intel may affect your daily missions or assignments
    `,
  },
  {
    id: 'live-session',
    title: 'Live Session',
    icon: Radio,
    content: `
Live Sessions are real-time interactive learning experiences led by instructors.

**How to Join:**
1. Navigate to the Live Session section
2. Enter the session code provided by your instructor
3. Follow along with the presentation

**During Sessions:**
- The instructor controls the flow of content
- You'll see the current step and can follow along
- Participate actively and ask questions
- Complete any in-session activities

**After Sessions:**
- Review any materials covered
- Complete assigned homework
- Reflect on key learnings
    `,
  },
  {
    id: 'my-progress',
    title: 'My Progress',
    icon: User,
    content: `
My Progress (My Dashboard) is your personal tracking center where you can monitor your performance.

**What You'll See:**
- **Your Stats**: Total points, submissions, average rating, and streak
- **Missing Assignments**: Tasks you haven't submitted yet
- **Submission History**: All your past submissions with status
- **Achievements**: Badges and recognition you've earned
- **Comparison**: How you compare to your team and the academy

**Understanding Your Stats:**
- **Points**: Earned from completing assignments and bonus activities
- **Streak**: Consecutive days with submissions
- **Rating**: Average mentor and peer review scores
- **Rank**: Your position on the leaderboard

**Tips:**
- Focus on completing missing assignments first
- Maintain your streak for bonus points
- Review feedback to improve future submissions
    `,
  },
  {
    id: 'peer-reviews',
    title: 'Peer Reviews',
    icon: UsersRound,
    content: `
Peer Reviews allow you to give and receive feedback from fellow participants.

**How It Works:**
1. You're assigned submissions from other participants to review
2. Review the work and provide constructive feedback
3. Rate the submission based on quality
4. Earn bonus points for completing reviews

**Giving Reviews:**
- Be constructive and specific in your feedback
- Focus on what works well and what could improve
- Rate fairly and consistently
- Complete reviews promptly

**Receiving Reviews:**
- Check the "Received" tab for feedback on your work
- Learn from the feedback to improve
- Reviews are anonymous to encourage honest feedback

**Benefits:**
- Learn from seeing how others approach problems
- Improve your own work based on feedback
- Earn bonus points for participation
    `,
  },
  {
    id: 'leaderboard',
    title: 'Leaderboard',
    icon: Trophy,
    content: `
The Leaderboard shows rankings of all participants based on their performance.

**Ranking Factors:**
- Total points earned from assignments
- Number of submissions
- Average mentor and peer ratings
- Current streak

**Leaderboard Views:**
- **Overall**: All participants ranked together
- **By Team**: Compare performance across teams
- **By Role**: See how you rank among peers in your role

**How to Improve Your Rank:**
- Submit all assignments on time
- Aim for high-quality work to get better ratings
- Maintain your daily streak
- Earn achievements for bonus points
- Complete peer reviews for additional points
    `,
  },
  {
    id: 'progress-matrix',
    title: 'Progress Matrix',
    icon: Grid3X3,
    content: `
The Progress Matrix provides a visual overview of completion rates across the program.

**What It Shows:**
- Completion status by day and assignment type
- Breakdown by role and team
- Overall program progress

**Reading the Matrix:**
- Green indicates high completion rates
- Yellow indicates moderate completion
- Red indicates low completion or overdue items

**Using the Matrix:**
- Identify which assignments have low completion
- See how your team compares to others
- Track overall program progress
    `,
  },
  {
    id: 'teams',
    title: 'Teams',
    icon: Users,
    content: `
The Teams section shows information about all teams in the program.

**Team Information:**
- Team members and their roles
- Team statistics and rankings
- Collective achievements

**Team Competition:**
- Teams are ranked based on combined performance
- Team points are the sum of all member points
- Collaborate with your team to improve rankings

**Finding Your Team:**
- Your team is shown in your profile
- Click on any team to see its members
- View team-specific statistics and progress
    `,
  },
  {
    id: 'analytics',
    title: 'Analytics',
    icon: BarChart3,
    content: `
The Analytics section provides detailed insights into program performance.

**Available Analytics:**
- **Submission Trends**: How submissions change over time
- **Rating Distribution**: Breakdown of rating scores
- **Role Comparison**: Performance by role type
- **Team Performance**: Comparative team statistics

**Using Analytics:**
- Identify patterns in program performance
- Understand where improvements are needed
- Track progress toward goals
- Compare your performance to averages
    `,
  },
  {
    id: 'profile',
    title: 'Profile & Settings',
    icon: Settings,
    content: `
Your Profile contains your personal information and account settings.

**Profile Information:**
- Name, email, and avatar
- Role and team assignment
- GitHub connection status

**GitHub Integration:**
- Connect your GitHub account to submit code
- Set up webhooks for automatic submission tracking
- View your repository link

**Account Settings:**
- Email notification preferences
- Account status
- Delete account option (in Danger Zone)

**Managing Your Profile:**
- Access profile from the user menu (top right)
- Update settings as needed
- Connect GitHub if you haven't already
    `,
  },
];

export default function HelpPage() {
  const { user, isLoading, userStatus, isAdmin } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated or not approved
  useEffect(() => {
    if (!isLoading && (!user || (!isAdmin && userStatus !== 'approved'))) {
      router.push('/login');
    }
  }, [user, isLoading, userStatus, isAdmin, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0062FF]" />
      </div>
    );
  }

  if (!user || (!isAdmin && userStatus !== 'approved')) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#0062FF]">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold">Help Center</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Welcome to the AI Academy Help Center. Here you&apos;ll find guides for all features of the platform.
        </p>
      </div>

      {/* Table of Contents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Quick Navigation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {helpSections.map((section) => {
              const Icon = section.icon;
              return (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors text-sm"
                >
                  <Icon className="h-4 w-4 text-[#0062FF]" />
                  <span>{section.title}</span>
                </a>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Help Sections */}
      <div className="space-y-6">
        {helpSections.map((section, index) => {
          const Icon = section.icon;
          return (
            <Card key={section.id} id={section.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0062FF]/10">
                    <Icon className="h-5 w-5 text-[#0062FF]" />
                  </div>
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {section.content.split('\n\n').map((paragraph, pIndex) => {
                    if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                      return (
                        <h4 key={pIndex} className="font-semibold mt-4 mb-2">
                          {paragraph.replace(/\*\*/g, '')}
                        </h4>
                      );
                    }
                    if (paragraph.startsWith('- ')) {
                      const items = paragraph.split('\n').filter(line => line.startsWith('- '));
                      return (
                        <ul key={pIndex} className="list-disc list-inside space-y-1 text-muted-foreground">
                          {items.map((item, iIndex) => {
                            // Safe rendering of markdown bold
                            const text = item.substring(2);
                            const parts = text.split(/\*\*(.+?)\*\*/g);
                            return (
                              <li key={iIndex}>
                                {parts.map((part, partIndex) =>
                                  partIndex % 2 === 1 ? <strong key={partIndex}>{part}</strong> : part
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      );
                    }
                    if (paragraph.match(/^\d+\./)) {
                      const items = paragraph.split('\n').filter(line => line.match(/^\d+\./));
                      return (
                        <ol key={pIndex} className="list-decimal list-inside space-y-1 text-muted-foreground">
                          {items.map((item, iIndex) => (
                            <li key={iIndex}>{item.replace(/^\d+\.\s*/, '')}</li>
                          ))}
                        </ol>
                      );
                    }
                    // Safe rendering of paragraph with bold
                    const parts = paragraph.split(/\*\*(.+?)\*\*/g);
                    return (
                      <p key={pIndex} className="text-muted-foreground">
                        {parts.map((part, partIndex) =>
                          partIndex % 2 === 1 ? <strong key={partIndex} className="text-foreground">{part}</strong> : part
                        )}
                      </p>
                    );
                  })}
                </div>
              </CardContent>
              {index < helpSections.length - 1 && <Separator className="mt-4" />}
            </Card>
          );
        })}
      </div>

      {/* Footer */}
      <Card className="bg-[#0062FF]/5 border-[#0062FF]/20">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <h3 className="font-semibold">Need More Help?</h3>
            <p className="text-sm text-muted-foreground">
              If you can&apos;t find what you&apos;re looking for, contact your instructor or program administrator.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
