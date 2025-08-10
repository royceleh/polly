"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Calendar, Users, TrendingUp } from "lucide-react"
import { votePoll } from "@/lib/actions/polls"
import Image from "next/image"

interface PollCardProps {
  poll: {
    id: string
    question: string
    image_url?: string
    created_at: string
    user_response?: {
      id: string
      answer: boolean
    }
    vote_counts?: {
      yes: number
      no: number
      total: number
    }
  }
}

export default function PollCard({ poll }: PollCardProps) {
  const [isVoting, setIsVoting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleVote = async (answer: boolean) => {
    setIsVoting(true)
    setMessage(null)

    try {
      const result = await votePoll(poll.id, answer)

      if (result.error) {
        setMessage({ type: "error", text: result.error })
      } else if (result.success) {
        setMessage({ type: "success", text: result.success })
        // Refresh the page to show updated data
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred. Please try again." })
    } finally {
      setIsVoting(false)
    }
  }

  const getPercentage = (count: number, total: number) => {
    if (total === 0) return 0
    return Math.round((count / total) * 100)
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg leading-tight">{poll.question}</CardTitle>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            {new Date(poll.created_at).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            })}
          </div>
          {poll.vote_counts && (
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              {poll.vote_counts.total} {poll.vote_counts.total === 1 ? "vote" : "votes"}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {poll.image_url && (
          <div className="relative h-48 w-full rounded-lg overflow-hidden">
            <Image src={poll.image_url || "/placeholder.svg"} alt="Poll image" fill className="object-cover" />
          </div>
        )}

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

        {poll.user_response ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2 p-3 bg-gray-50 rounded-lg">
              {poll.user_response.answer ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="font-medium text-gray-700">You voted: {poll.user_response.answer ? "Yes" : "No"}</span>
            </div>

            {poll.vote_counts && poll.vote_counts.total > 0 && (
              <div className="space-y-3">
                <div className="flex items-center text-sm font-medium text-gray-700">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Results
                </div>

                <div className="space-y-3">
                  {/* Yes Results */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span className="font-medium">Yes</span>
                      </div>
                      <span className="font-bold text-green-600">
                        {poll.vote_counts.yes} ({getPercentage(poll.vote_counts.yes, poll.vote_counts.total)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${getPercentage(poll.vote_counts.yes, poll.vote_counts.total)}%` }}
                      />
                    </div>
                  </div>

                  {/* No Results */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <XCircle className="h-4 w-4 text-red-500 mr-2" />
                        <span className="font-medium">No</span>
                      </div>
                      <span className="font-bold text-red-600">
                        {poll.vote_counts.no} ({getPercentage(poll.vote_counts.no, poll.vote_counts.total)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${getPercentage(poll.vote_counts.no, poll.vote_counts.total)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-gray-600 text-sm font-medium text-center">What's your answer?</p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleVote(true)}
                disabled={isVoting}
                className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-medium py-3"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Yes</span>
              </Button>
              <Button
                onClick={() => handleVote(false)}
                disabled={isVoting}
                className="flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white font-medium py-3"
              >
                <XCircle className="h-4 w-4" />
                <span>No</span>
              </Button>
            </div>
            {isVoting && <p className="text-center text-sm text-gray-500 animate-pulse">Recording your vote...</p>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
