import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { LogOut, Plus, ArrowRight, Trophy, Gift, TrendingUp } from "lucide-react"
import { signOut } from "@/lib/actions"
import { getPollsWithResponses, getUserPoints } from "@/lib/actions/polls"
import Link from "next/link"
import MarketPollCard from "@/components/market-poll-card"

export default async function Home() {
  // If Supabase is not configured, show setup message directly
  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#161616]">
        <h1 className="text-2xl font-bold mb-4 text-white">Connect Supabase to get started</h1>
      </div>
    )
  }

  // Get the user from the server
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If no user, redirect to login
  if (!user) {
    redirect("/auth/login")
  }

  const polls = await getPollsWithResponses()
  const userPoints = await getUserPoints()
  const recentPolls = polls.slice(0, 6) // Show only first 6 polls on home page

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">pollymkt</h1>
              <div className="hidden md:flex items-center space-x-6 ml-8">
                <Link href="/polls" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                  Markets
                </Link>
                <Link href="/dashboard" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                  Portfolio
                </Link>
                <Link href="/rewards" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                  Rewards
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button asChild variant="ghost" size="sm" className="text-yellow-600 hover:text-yellow-700">
                <Link href="/dashboard" className="flex items-center">
                  <Trophy className="h-4 w-4 mr-1" />
                  {userPoints}
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/rewards" className="flex items-center">
                  <Gift className="h-4 w-4 mr-1" />
                  Rewards
                </Link>
              </Button>
              <span className="text-sm text-gray-600 hidden md:block">Welcome, {user.email}</span>
              <form action={signOut}>
                <Button type="submit" variant="outline" size="sm">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {recentPolls.length === 0 ? (
          <div className="max-w-4xl mx-auto text-center py-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Prediction Markets</h2>
            <p className="text-xl text-gray-600 mb-12">
              Create and trade on prediction markets. Earn points by making accurate predictions.
            </p>

            <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-8">
                  <TrendingUp className="h-16 w-16 text-blue-600 mx-auto mb-6" />
                  <h3 className="text-xl font-semibold mb-3">Browse Markets</h3>
                  <p className="text-gray-600 mb-6">
                    Explore prediction markets and earn 1 point for each prediction you make
                  </p>
                  <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                    <Link href="/polls">
                      View Markets
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-8">
                  <Plus className="h-16 w-16 text-green-600 mx-auto mb-6" />
                  <h3 className="text-xl font-semibold mb-3">Create Market</h3>
                  <p className="text-gray-600 mb-6">Ask the community a yes/no question and see what people predict</p>
                  <Button asChild className="w-full bg-transparent" variant="outline">
                    <Link href="/polls/create">
                      Create Market
                      <Plus className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 space-y-4 lg:space-y-0">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Trending Markets</h2>
                <p className="text-gray-600 mt-2">Latest prediction markets • Earn points for each prediction</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard">
                    <Trophy className="h-4 w-4 mr-2" />
                    Portfolio
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/polls">
                    View All Markets
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
                <Button asChild className="bg-blue-600 hover:bg-blue-700" size="sm">
                  <Link href="/polls/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Market
                  </Link>
                </Button>
              </div>
            </div>

            {/* Market Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {recentPolls.map((poll) => (
                <MarketPollCard key={poll.id} poll={poll} />
              ))}
            </div>

            {polls.length > 6 && (
              <div className="text-center mt-12">
                <Button asChild variant="outline" size="lg">
                  <Link href="/polls">
                    View All {polls.length} Markets
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
