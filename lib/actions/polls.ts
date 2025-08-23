"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { CreatePollData } from "@/lib/types/poll"

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
  const pollType = formData.get("pollType")?.toString() as 'binary' | 'multiple'
  const options = formData.getAll("options").map(opt => opt.toString()).filter(opt => opt.trim().length > 0)

  // Validate question
  if (!question || question.trim().length === 0) {
    return { error: "Question is required" }
  }

  if (question.length > 120) {
    return { error: "Question must be 120 characters or less" }
  }

  // Validate poll type
  if (!pollType || !['binary', 'multiple'].includes(pollType)) {
    return { error: "Invalid poll type" }
  }

  // Validate options for multiple-option polls
  if (pollType === 'multiple') {
    if (!options || options.length < 2) {
      return { error: "Multiple-option polls must have at least 2 options" }
    }
    
    for (const option of options) {
      if (option.length > 100) {
        return { error: "Each option must be 100 characters or less" }
      }
    }
  }

  let imageUrl: string | null = null

  // Handle image upload if provided
  if (image && image.size > 0) {
    if (image.size > 5 * 1024 * 1024) {
      return { error: "Image must be 5MB or less" }
    }

    const fileExt = image.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('poll-images')
      .upload(fileName, image)

    if (uploadError) {
      console.error("Image upload error:", uploadError)
      return { error: "Failed to upload image. Please try again." }
    }

    const { data: { publicUrl } } = supabase.storage
      .from('poll-images')
      .getPublicUrl(fileName)

    imageUrl = publicUrl
  }

  try {
    // Insert the poll
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .insert({
        user_id: user.id,
        question: question.trim(),
        image_url: imageUrl,
        poll_type: pollType,
      })
      .select()
      .single()

    if (pollError) {
      console.error("Poll insert error:", pollError)
      return { error: "Failed to create poll. Please try again." }
    }

    // Insert options for multiple-option polls
    if (pollType === 'multiple' && poll) {
      const optionsToInsert = options.map(optionText => ({
        poll_id: poll.id,
        option_text: optionText.trim()
      }))

      const { error: optionsError } = await supabase
        .from("poll_options")
        .insert(optionsToInsert)

      if (optionsError) {
        console.error("Options insert error:", optionsError)
        return { error: "Failed to create poll options. Please try again." }
      }
    }

    revalidatePath("/")
    revalidatePath("/polls")
    return { success: "Poll created successfully!" }
  } catch (error) {
    console.error("Create poll error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function votePoll(pollId: string, answer: boolean | string) {
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
    // Get poll details to determine type
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .select("poll_type")
      .eq("id", pollId)
      .single()

    if (pollError || !poll) {
      return { error: "Poll not found" }
    }

    if (poll.poll_type === 'binary') {
      // Handle binary poll voting (existing logic)
      const answerBool = answer as boolean
      
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
        answer: answerBool,
      })

      if (insertError) {
        console.error("Vote insert error:", insertError)
        return { error: "Failed to record your vote. Please try again." }
      }

      revalidatePath("/")
      revalidatePath("/polls")
      revalidatePath("/dashboard")
      return { success: `Vote recorded! You earned 1 point for answering "${answerBool ? "Yes" : "No"}".` }
    } else {
      // Handle multiple-option poll voting
      const optionId = answer as string
      
      // Check if user already voted on this poll
      const { data: existingVote } = await supabase
        .from("poll_option_votes")
        .select("id")
        .eq("poll_id", pollId)
        .eq("user_id", user.id)
        .single()

      if (existingVote) {
        return { error: "You have already voted on this poll" }
      }

      // Verify the option exists for this poll
      const { data: option, error: optionError } = await supabase
        .from("poll_options")
        .select("option_text")
        .eq("id", optionId)
        .eq("poll_id", pollId)
        .single()

      if (optionError || !option) {
        return { error: "Invalid option selected" }
      }

      // Insert the vote
      const { error: insertError } = await supabase.from("poll_option_votes").insert({
        poll_id: pollId,
        option_id: optionId,
        user_id: user.id,
      })

      if (insertError) {
        console.error("Option vote insert error:", insertError)
        return { error: "Failed to record your vote. Please try again." }
      }

      revalidatePath("/")
      revalidatePath("/polls")
      revalidatePath("/dashboard")
      return { success: `Vote recorded! You earned 1 point for selecting "${option.option_text}".` }
    }
  } catch (error) {
    console.error("Vote error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function getUserPoints(userId?: string) {
  const supabase = createServerActionClient({ cookies })

  // Get current user if userId not provided
  let targetUserId = userId
  if (!targetUserId) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    targetUserId = user?.id
  }

  if (!targetUserId) {
    return 0
  }

  try {
    const { data: points, error } = await supabase
      .from("user_points")
      .select("points")
      .eq("user_id", targetUserId)
      .single()

    if (error) {
      console.error("Error getting user points:", error)
      return 0
    }

    return points?.points || 0
  } catch (error) {
    console.error("Error getting user points:", error)
    return 0
  }
}

export async function getPolls() {
  const supabase = createServerActionClient({ cookies })

  try {
    const { data: polls, error } = await supabase
      .from("polls")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error getting polls:", error)
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
  
  // Create service role client to bypass RLS (with fallback)
  let serviceSupabase = null
  try {
    const { createClient } = await import('@supabase/supabase-js')
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      serviceSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
    }
  } catch (error) {
    console.warn('Service role client not available, falling back to regular client')
  }

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  try {
    // Get all polls with their options
    const { data: polls, error } = await supabase
      .from("polls")
      .select(`
        *,
        poll_options!poll_id (
          id,
          option_text,
          created_at
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching polls:", error)
      return []
    }

    // Debug logging
    console.log("Raw polls data:", polls?.map(p => ({
      id: p.id,
      poll_type: p.poll_type,
      options: p.poll_options,
      optionsCount: p.poll_options?.length
    })))

    // Process polls to include user responses and vote counts
    const processedPolls = await Promise.all(
      (polls || []).map(async (poll) => {
        if (poll.poll_type === 'binary') {
          // Handle binary polls - fetch responses separately to bypass RLS issues
          console.log("Processing binary poll:", poll.id)
          
          // Use service role client to bypass RLS for vote counting (with fallback)
          const { data: responses, error: responsesError } = await (serviceSupabase || supabase)
            .from("poll_responses")
            .select("*")
            .eq("poll_id", poll.id)
          
          console.log("Fetched binary responses:", responses?.length, "Error:", responsesError)
          
          // Debug for specific poll
          if (poll.id === '411e4729-4b1b-4f33-ae50-11e9477f1a39') {
            console.log('DEBUG: Responses query result:', responses?.length, 'Error:', responsesError)
          }

          const userResponse = user ? responses?.find((r: any) => r.user_id === user.id) : null
          const yesCount = responses?.filter((r: any) => r.answer === true).length || 0
          const noCount = responses?.filter((r: any) => r.answer === false).length || 0
          const totalCount = responses?.length || 0
          
          // Simple debug for specific poll
          if (poll.id === '411e4729-4b1b-4f33-ae50-11e9477f1a39') {
            console.log('DEBUG: Poll responses count:', responses?.length, 'Total:', totalCount, 'Yes:', yesCount, 'No:', noCount)
          }
          


          const result = {
            ...poll,
            user_response: userResponse,
            vote_counts: {
              yes: yesCount,
              no: noCount,
              total: totalCount,
            },
          }
          
          // Debug for specific poll
          if (poll.id === '411e4729-4b1b-4f33-ae50-11e9477f1a39') {
            console.log('DEBUG: Final poll result:', {
              id: result.id,
              vote_counts: result.vote_counts,
              user_response: result.user_response
            })
          }
          
          return result
        } else {
          // Handle multiple-option polls
          console.log("Processing multiple-option poll:", poll.id, "Options:", poll.poll_options)
          
          // Fetch options separately to bypass potential RLS issues
          const { data: options, error: optionsError } = await supabase
            .from("poll_options")
            .select("*")
            .eq("poll_id", poll.id)
            .order("created_at")
          
          console.log("Fetched options separately:", options, "Error:", optionsError)
          
          const { data: optionVotes } = await supabase
            .from("poll_option_votes")
            .select("*")
            .eq("poll_id", poll.id)

          const userVote = user ? optionVotes?.find((v: any) => v.user_id === user.id) : null
          const totalVotes = optionVotes?.length || 0

          // Calculate vote counts per option
          const optionVoteCounts: { [key: string]: { count: number; percentage: number } } = {}
          options?.forEach((option: any) => {
            const count = optionVotes?.filter((v: any) => v.option_id === option.id).length || 0
            const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
            optionVoteCounts[option.id] = { count, percentage }
          })

          const result = {
            ...poll,
            options: options || [], // Use separately fetched options
            user_response: userVote,
            vote_counts: {
              yes: 0, // Not applicable for multiple-option polls
              no: 0,
              total: totalVotes,
            },
            option_vote_counts: optionVoteCounts,
          }
          
          console.log("Processed multiple-option poll result:", {
            id: result.id,
            options: result.options,
            optionsLength: result.options?.length
          })
          
          return result
        }
      })
    )

    return processedPolls
  } catch (error) {
    console.error("Error getting polls with responses:", error)
    return []
  }
}

export async function getUserPolls() {
  const supabase = createServerActionClient({ cookies })

  // Get current user
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
      console.error("Error getting user polls:", error)
      return []
    }

    return polls || []
  } catch (error) {
    console.error("Error getting user polls:", error)
    return []
  }
}

export async function getUserStats() {
  const supabase = createServerActionClient({ cookies })

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      totalPolls: 0,
      totalVotes: 0,
      totalPoints: 0,
    }
  }

  try {
    // Get user's polls
    const { data: polls } = await supabase
      .from("polls")
      .select("id")
      .eq("user_id", user.id)

    // Get user's votes (binary polls)
    const { data: binaryVotes } = await supabase
      .from("poll_responses")
      .select("id")
      .eq("user_id", user.id)

    // Get user's votes (multiple-option polls)
    const { data: optionVotes } = await supabase
      .from("poll_option_votes")
      .select("id")
      .eq("user_id", user.id)

    // Get user's points
    const { data: points } = await supabase
      .from("user_points")
      .select("points")
      .eq("user_id", user.id)
      .single()

    return {
      totalPolls: polls?.length || 0,
      totalVotes: (binaryVotes?.length || 0) + (optionVotes?.length || 0),
      totalPoints: points?.points || 0,
    }
  } catch (error) {
    console.error("Error getting user stats:", error)
    return {
      totalPolls: 0,
      totalVotes: 0,
      totalPoints: 0,
    }
  }
}
