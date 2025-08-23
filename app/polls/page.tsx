import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getPollsWithResponses, getUserPoints } from "@/lib/actions/polls"
import PollsClient from "./polls-client"
import { PollWithResponses } from "@/lib/types/poll"

export default async function PollsPage() {
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

  const polls = await getPollsWithResponses()
  const userPoints = await getUserPoints()

  return <PollsClient initialPolls={polls} initialUserPoints={userPoints} />
}
