"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

export interface Reward {
  id: string
  name: string
  description?: string
  points_required: number
  is_active: boolean
  created_at: string
}

export interface RewardRedemption {
  id: string
  reward_id: string
  user_id: string
  points_spent: number
  redeemed_at: string
  rewards?: Reward
}

export async function getActiveRewards(): Promise<Reward[]> {
  const supabase = createServerActionClient({ cookies })

  try {
    const { data: rewards, error } = await supabase
      .from("rewards")
      .select("*")
      .eq("is_active", true)
      .order("points_required", { ascending: true })

    if (error) {
      console.error("Error fetching rewards:", error)
      return []
    }

    return rewards || []
  } catch (error) {
    console.error("Error getting active rewards:", error)
    return []
  }
}

export async function getUserRedemptions(): Promise<RewardRedemption[]> {
  const supabase = createServerActionClient({ cookies })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  try {
    const { data: redemptions, error } = await supabase
      .from("reward_redemptions")
      .select(`
        *,
        rewards (
          id,
          name,
          description,
          points_required
        )
      `)
      .eq("user_id", user.id)
      .order("redeemed_at", { ascending: false })

    if (error) {
      console.error("Error fetching user redemptions:", error)
      return []
    }

    return redemptions || []
  } catch (error) {
    console.error("Error getting user redemptions:", error)
    return []
  }
}

export async function redeemReward(rewardId: string) {
  const supabase = createServerActionClient({ cookies })

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: "You must be logged in to redeem rewards" }
  }

  try {
    // Call the database function to handle redemption
    const { data, error } = await supabase.rpc("redeem_reward", {
      p_reward_id: rewardId,
      p_user_id: user.id,
    })

    if (error) {
      console.error("Redemption error:", error)
      return { error: "Failed to process redemption. Please try again." }
    }

    const result = data as { success: boolean; error?: string; message?: string }

    if (!result.success) {
      return { error: result.error || "Redemption failed" }
    }

    // Revalidate relevant paths
    revalidatePath("/rewards")
    revalidatePath("/dashboard")
    revalidatePath("/")

    return { success: result.message || "Reward redeemed successfully!" }
  } catch (error) {
    console.error("Redeem reward error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function getRewardStats() {
  const supabase = createServerActionClient({ cookies })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      totalRedemptions: 0,
      totalPointsSpent: 0,
      availableRewards: 0,
    }
  }

  try {
    // Get total redemptions and points spent
    const { data: redemptions } = await supabase
      .from("reward_redemptions")
      .select("points_spent")
      .eq("user_id", user.id)

    const totalRedemptions = redemptions?.length || 0
    const totalPointsSpent = redemptions?.reduce((sum, r) => sum + r.points_spent, 0) || 0

    // Get available rewards count
    const { count: availableRewards } = await supabase
      .from("rewards")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)

    return {
      totalRedemptions,
      totalPointsSpent,
      availableRewards: availableRewards || 0,
    }
  } catch (error) {
    console.error("Error getting reward stats:", error)
    return {
      totalRedemptions: 0,
      totalPointsSpent: 0,
      availableRewards: 0,
    }
  }
}
