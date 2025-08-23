"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

export async function createPoll(prevState: any, formData: FormData) {
  const supabase = createServerActionClient({ cookies })

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: "You must be logged in to create a poll" }
  }

  // Get form data
  const question = formData.get("question")?.toString()
  const image = formData.get("image") as File

  // Validate question
  if (!question || question.trim().length === 0) {
    return { error: "Question is required" }
  }

  if (question.length > 120) {
    return { error: "Question must be 120 characters or less" }
  }

  let imageUrl: string | null = null

  // Handle image upload if provided
  if (image && image.size > 0) {
    // Validate image
    if (!image.type.startsWith("image/")) {
      return { error: "Please upload a valid image file" }
    }

    // Check file size (5MB limit)
    if (image.size > 5 * 1024 * 1024) {
      return { error: "Image must be less than 5MB" }
    }

    // Generate unique filename
    const fileExt = image.name.split(".").pop()
    const fileName = `${user.id}/${Date.now()}.${fileExt}`

    try {
      // Upload image to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("poll-images")
        .upload(fileName, image, {
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) {
        console.error("Upload error:", uploadError)
        return { error: "Failed to upload image. Please try again." }
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("poll-images").getPublicUrl(uploadData.path)

      imageUrl = publicUrl
    } catch (error) {
      console.error("Image upload error:", error)
      return { error: "Failed to upload image. Please try again." }
    }
  }

  // Create poll in database
  try {
    const { error: insertError } = await supabase.from("polls").insert({
      user_id: user.id,
      question: question.trim(),
      image_url: imageUrl,
    })

    if (insertError) {
      console.error("Database insert error:", insertError)
      return { error: "Failed to create poll. Please try again." }
    }

    revalidatePath("/")
    revalidatePath("/polls")
    return { success: "Poll created successfully!" }
  } catch (error) {
    console.error("Create poll error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function votePoll(pollId: string, answer: boolean) {
  const supabase = createServerActionClient({ cookies })

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: "You must be logged in to vote" }
  }

  try {
    // Check if user already voted on this poll
    const { data: existingResponse } = await supabase
      .from("poll_responses")
      .select("id")
      .eq("poll_id", pollId)
      .eq("user_id", user.id)
      .single()

    if (existingResponse) {
      return { error: "You have already voted on this poll" }
    }

    // Insert the vote (points will be automatically incremented by trigger)
    const { error: insertError } = await supabase.from("poll_responses").insert({
      poll_id: pollId,
      user_id: user.id,
      answer,
    })

    if (insertError) {
      console.error("Vote insert error:", insertError)
      return { error: "Failed to record your vote. Please try again." }
    }

    revalidatePath("/")
    revalidatePath("/polls")
    revalidatePath("/dashboard")
    return { success: `Vote recorded! You earned 1 point for answering "${answer ? "Yes" : "No"}".` }
  } catch (error) {
    console.error("Vote error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function getUserPoints(userId?: string) {
  const supabase = createServerActionClient({ cookies })

  // Get current user if no userId provided
  let targetUserId = userId
  if (!targetUserId) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return 0
    targetUserId = user.id
  }

  try {
    const { data: userPoints, error } = await supabase
      .from("user_points")
      .select("points")
      .eq("user_id", targetUserId)
      .single()

    if (error) {
      // If no points record exists, create one
      if (error.code === "PGRST116") {
        const { error: insertError } = await supabase.from("user_points").insert({ user_id: targetUserId, points: 0 })

        if (insertError) {
          console.error("Error creating user points:", insertError)
          return 0
        }
        return 0
      }
      console.error("Error fetching user points:", error)
      return 0
    }

    return userPoints?.points || 0
  } catch (error) {
    console.error("Error getting user points:", error)
    return 0
  }
}

export async function getUserStats() {
  const supabase = createServerActionClient({ cookies })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      points: 0,
      pollsAnswered: 0,
      pollsCreated: 0,
    }
  }

  try {
    // Get user points
    const points = await getUserPoints(user.id)

    // Get polls answered count
    const { count: pollsAnswered } = await supabase
      .from("poll_responses")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)

    // Get polls created count
    const { count: pollsCreated } = await supabase
      .from("polls")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)

    return {
      points,
      pollsAnswered: pollsAnswered || 0,
      pollsCreated: pollsCreated || 0,
    }
  } catch (error) {
    console.error("Error getting user stats:", error)
    return {
      points: 0,
      pollsAnswered: 0,
      pollsCreated: 0,
    }
  }
}

export async function getPolls() {
  const supabase = createServerActionClient({ cookies })

  try {
    const { data: polls, error } = await supabase.from("polls").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching polls:", error)
      return []
    }

    return polls || []
  } catch (error) {
    console.error("Error getting polls:", error)
    return []
  }
}

export async function getPollsWithResponses() {
  const supabase = createServerActionClient({ cookies })

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  try {
    // Get all polls with response counts
    const { data: polls, error } = await supabase
      .from("polls")
      .select(`
        *,
        poll_responses (
          id,
          answer,
          user_id,
          created_at
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching polls:", error)
      return []
    }

    // Process polls to include user responses and vote counts
    const processedPolls =
      polls?.map((poll) => {
        const responses = poll.poll_responses || []
        const userResponse = user ? responses.find((r: any) => r.user_id === user.id) : null

        const yesCount = responses.filter((r: any) => r.answer === true).length
        const noCount = responses.filter((r: any) => r.answer === false).length
        const totalCount = responses.length

        return {
          ...poll,
          user_response: userResponse,
          vote_counts: {
            yes: yesCount,
            no: noCount,
            total: totalCount,
          },
        }
      }) || []

    return processedPolls
  } catch (error) {
    console.error("Error getting polls with responses:", error)
    return []
  }
}

export async function getUserPolls() {
  const supabase = createServerActionClient({ cookies })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  try {
    const { data: polls, error } = await supabase
      .from("polls")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching user polls:", error)
      return []
    }

    return polls || []
  } catch (error) {
    console.error("Error getting user polls:", error)
    return []
  }
}
