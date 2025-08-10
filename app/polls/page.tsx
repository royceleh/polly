import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getPollsWithResponses, getUserPoints } from "@/lib/actions/polls"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Vote, TrendingUp, Trophy, ArrowLeft, Gift, Filter, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import MarketPollCard from "@/components/market-poll-card"

export default async function PollsPage() {
  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#161616]">
        <h1 className="text-2xl font-bold mb-4 text-white">Connect Supabase to get started</h1>
      </div>
    )
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const polls = await getPollsWithResponses()
  const userPoints = await getUserPoints()

  // Separate polls by voting status for better organization
  const unvotedPolls = polls.filter((poll) => !poll.user_response)
  const votedPolls = polls.filter((poll) => poll.user_response)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild className="p-2">
                <Link href="/">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <TrendingUp className="h-6 w-6 mr-2 text-blue-600" />
                  Markets
                </h1>
                <p className="text-sm text-gray-600">
                  {userPoints} points • {unvotedPolls.length} active markets
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard">
                  <Trophy className="h-4 w-4 mr-1" />
                  Dashboard
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/rewards">
                  <Gift className="h-4 w-4 mr-1" />
                  Rewards
                </Link>
              </Button>
              <Button asChild className="bg-blue-600 hover:bg-blue-700" size="sm">
                <Link href="/polls/create">
                  <Plus className="h-4 w-4 mr-1" />
                  Create Market
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Filters and Search */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search markets..." className="pl-10 w-64 bg-white border-gray-200" />
            </div>
            <Button variant="outline" size="sm" className="flex items-center bg-transparent">
              <Filter className="h-4 w-4 mr-1" />
              Filter
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs">
              {polls.length} total markets
            </Badge>
          </div>
        </div>

        {polls.length === 0 ? (
          <div className="text-center py-16">
            <Card className="max-w-md mx-auto">
              <CardContent className="p-8">
                <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No markets available</h3>
                <p className="text-gray-600 mb-6">
                  Be the first to create a prediction market and start engaging with the community!
                </p>
                <Button asChild className="bg-blue-600 hover:bg-blue-700">
                  <Link href="/polls/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Market
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Active Markets (Unvoted) */}
            {unvotedPolls.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Vote className="h-5 w-5 mr-2 text-green-600" />
                    Active Markets
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {unvotedPolls.length}
                    </Badge>
                  </h2>
                  <p className="text-sm text-gray-600">Earn 1 point per prediction</p>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {unvotedPolls.map((poll) => (
                    <MarketPollCard key={poll.id} poll={poll} />
                  ))}
                </div>
              </div>
            )}

            {/* Your Predictions (Voted) */}
            {votedPolls.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Trophy className="h-5 w-5 mr-2 text-yellow-600" />
                    Your Predictions
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {votedPolls.length}
                    </Badge>
                  </h2>
                  <p className="text-sm text-gray-600">Markets you've participated in</p>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {votedPolls.map((poll) => (
                    <MarketPollCard key={poll.id} poll={poll} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
