"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Gift, Star, Loader2 } from "lucide-react"
import { redeemReward } from "@/lib/actions/rewards"
import type { Reward } from "@/lib/actions/rewards"

interface RewardCardProps {
  reward: Reward
  userPoints: number
}

export default function RewardCard({ reward, userPoints }: RewardCardProps) {
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const canAfford = userPoints >= reward.points_required
  const isRedeemed = message?.type === "success"

  const handleRedeem = async () => {
    if (!canAfford || isRedeeming || isRedeemed) return

    setIsRedeeming(true)
    setMessage(null)

    try {
      const result = await redeemReward(reward.id)

      if (result.error) {
        setMessage({ type: "error", text: result.error })
      } else if (result.success) {
        setMessage({ type: "success", text: result.success })
        // Refresh the page after successful redemption to update points
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred. Please try again." })
    } finally {
      setIsRedeeming(false)
    }
  }

  return (
    <Card
      className={`hover:shadow-lg transition-all duration-200 ${canAfford ? "border-l-4 border-l-purple-500" : "opacity-75"}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <Gift className="h-5 w-5 mr-2 text-purple-600" />
            {reward.name}
          </CardTitle>
          <Badge variant={canAfford ? "default" : "secondary"} className="flex items-center">
            <Star className="h-3 w-3 mr-1" />
            {reward.points_required}
          </Badge>
        </div>
        {reward.description && <p className="text-sm text-gray-600 mt-2">{reward.description}</p>}
      </CardHeader>

      <CardContent className="space-y-4">
        {message && (
          <div
            className={`p-3 rounded-lg text-sm font-medium ${
              message.type === "success"
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Required Points:</span>
            <span className="font-semibold">{reward.points_required}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Your Points:</span>
            <span className={`font-semibold ${canAfford ? "text-green-600" : "text-red-600"}`}>{userPoints}</span>
          </div>
          {!canAfford && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Need:</span>
              <span className="font-semibold text-red-600">{reward.points_required - userPoints} more</span>
            </div>
          )}
        </div>

        <Button
          onClick={handleRedeem}
          disabled={!canAfford || isRedeeming || isRedeemed}
          className={`w-full ${
            canAfford && !isRedeemed ? "bg-purple-600 hover:bg-purple-700" : isRedeemed ? "bg-green-600" : "bg-gray-400"
          }`}
        >
          {isRedeeming ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Redeeming...
            </>
          ) : isRedeemed ? (
            "Redeemed!"
          ) : canAfford ? (
            "Redeem Now"
          ) : (
            `Need ${reward.points_required - userPoints} more points`
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
