import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getUserStats, getUserPolls } from "@/lib/actions/polls"
import { getRewardStats } from "@/lib/actions/rewards"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, TrendingUp, Vote, Plus, Calendar, CheckCircle, XCircle, Gift } from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#161616]">
        <h1 className="text-2xl font-bold mb-4 text-white">Connect Supabase to get started</h1>
      </div>
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const stats = await getUserStats()
  const userPolls = await getUserPolls()
  const rewardStats = await getRewardStats()

  // Get user's recent responses
  const { data: recentResponses } = await supabase
    .from("poll_responses")
    .select(`
      *,
      polls (
        id,
        question,
        created_at
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Trophy className="h-8 w-8 mr-3 text-yellow-600" />
              Your Dashboard
            </h1>
            <p className="text-gray-600 mt-2">Track your polling activity and points</p>
          </div>
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href="/polls">
              <Vote className="h-4 w-4 mr-2" />
              Browse Polls
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/rewards">
              <Gift className="h-4 w-4 mr-2" />
              Rewards Store
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Points</CardTitle>
              <Trophy className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.points}</div>
              <p className="text-xs text-muted-foreground">Earned from poll responses</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Polls Answered</CardTitle>
              <Vote className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.pollsAnswered}</div>
              <p className="text-xs text-muted-foreground">Community participation</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Polls Created</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.pollsCreated}</div>
              <p className="text-xs text-muted-foreground">Questions asked</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rewards Redeemed</CardTitle>
              <Gift className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{rewardStats.totalRedemptions}</div>
              <p className="text-xs text-muted-foreground">{rewardStats.totalPointsSpent} points spent</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Responses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Vote className="h-5 w-5 mr-2 text-blue-600" />
                Recent Responses
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentResponses && recentResponses.length > 0 ? (
                <div className="space-y-4">
                  {recentResponses.map((response: any) => (
                    <div key={response.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        {response.answer ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{response.polls.question}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant={response.answer ? "default" : "secondary"} className="text-xs">
                            {response.answer ? "Yes" : "No"}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(response.created_at).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <Badge variant="outline" className="text-xs text-yellow-600">
                          +1 point
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Vote className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No responses yet</p>
                  <Button asChild className="mt-4 bg-transparent" variant="outline">
                    <Link href="/polls">Start Answering Polls</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Your Polls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                  Your Polls
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href="/polls/create">
                    <Plus className="h-4 w-4 mr-1" />
                    Create
                  </Link>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userPolls.length > 0 ? (
                <div className="space-y-4">
                  {userPolls.slice(0, 5).map((poll) => (
                    <div key={poll.id} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900 truncate">{poll.question}</p>
                      <div className="flex items-center justify-between mt-2">
                                                  <div className="flex items-center text-xs text-gray-500">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(poll.created_at).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </div>
                        <Badge variant="secondary" className="text-xs">
                          Active
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {userPolls.length > 5 && (
                    <p className="text-xs text-gray-500 text-center">And {userPolls.length - 5} more polls...</p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No polls created yet</p>
                  <Button asChild className="mt-4 bg-transparent" variant="outline">
                    <Link href="/polls/create">Create Your First Poll</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
