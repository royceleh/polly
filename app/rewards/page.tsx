import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getActiveRewards, getUserRedemptions } from "@/lib/actions/rewards"
import { getUserPoints } from "@/lib/actions/polls"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Gift, Trophy, ArrowLeft, Star, Clock, CheckCircle } from "lucide-react"
import Link from "next/link"
import RewardCard from "@/components/reward-card"

export default async function RewardsPage() {
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

  const [rewards, userPoints, redemptions] = await Promise.all([
    getActiveRewards(),
    getUserPoints(),
    getUserRedemptions(),
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center mb-2">
              <Button variant="ghost" asChild className="mr-2 p-2">
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Gift className="h-8 w-8 mr-3 text-purple-600" />
                Rewards Store
              </h1>
            </div>
            <p className="text-gray-600">
              Redeem your points for exciting rewards. You have{" "}
              <span className="font-semibold text-yellow-600">{userPoints} points</span> to spend!
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard">
              <Trophy className="h-4 w-4 mr-2" />
              Dashboard
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="available" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="available" className="flex items-center">
              <Star className="h-4 w-4 mr-2" />
              Available Rewards
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Redemption History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-6">
            {rewards.length === 0 ? (
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <div className="bg-white rounded-xl p-8 shadow-sm border">
                    <Gift className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No rewards available</h3>
                    <p className="text-gray-600 mb-6">Check back later for exciting rewards to redeem!</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {rewards.map((reward) => (
                  <RewardCard key={reward.id} reward={reward} userPoints={userPoints} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            {redemptions.length === 0 ? (
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <div className="bg-white rounded-xl p-8 shadow-sm border">
                    <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No redemptions yet</h3>
                    <p className="text-gray-600 mb-6">
                      Start earning points by answering polls and redeem them for rewards!
                    </p>
                    <Button asChild className="bg-transparent" variant="outline">
                      <Link href="/polls">Browse Polls</Link>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {redemptions.map((redemption) => (
                  <Card key={redemption.id} className="border-l-4 border-l-green-500">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <CheckCircle className="h-8 w-8 text-green-500" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {redemption.rewards?.name || "Unknown Reward"}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {redemption.rewards?.description || "No description available"}
                            </p>
                                                          <p className="text-xs text-gray-500 mt-1">
                                Redeemed on {new Date(redemption.redeemed_at).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="text-red-600 border-red-200">
                            -{redemption.points_spent} points
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
