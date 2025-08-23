"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Users, TrendingUp, Clock } from "lucide-react"
import { votePoll } from "@/lib/actions/polls"
import Image from "next/image"

interface MarketPollCardProps {
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

export default function MarketPollCard({ poll }: MarketPollCardProps) {
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

  const yesPercentage = poll.vote_counts ? getPercentage(poll.vote_counts.yes, poll.vote_counts.total) : 0
  const noPercentage = poll.vote_counts ? getPercentage(poll.vote_counts.no, poll.vote_counts.total) : 0
  const totalVotes = poll.vote_counts?.total || 0
  const hasVoted = !!poll.user_response

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border border-gray-200 bg-white h-full">
      <CardContent className="p-4">
        <div className="flex flex-col h-full">
          {/* Header with Image and Question */}
          <div className="flex items-start space-x-3 mb-3">
            {/* Poll Image/Icon */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                {poll.image_url ? (
                  <Image
                    src={poll.image_url || "/placeholder.svg"}
                    alt="Poll"
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <TrendingUp className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </div>

            {/* Question and Percentage */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <h3 className="text-sm font-medium text-gray-900 leading-tight pr-2">{poll.question}</h3>
                {totalVotes > 0 && (
                  <div className="flex-shrink-0">
                    <span className="text-sm font-bold text-gray-900">{Math.max(yesPercentage, noPercentage)}%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Voting Options */}
            {hasVoted ? (
              <div className="space-y-2 mb-3 flex-1">
                <div className="grid grid-cols-2 gap-2">
                  <div
                    className={`flex items-center space-x-2 px-2 py-2 rounded-lg ${
                      poll.user_response?.answer
                        ? "bg-green-50 border border-green-200"
                        : "bg-gray-50 border border-gray-200"
                    }`}
                  >
                    <CheckCircle
                      className={`h-3 w-3 ${poll.user_response?.answer ? "text-green-600" : "text-gray-400"}`}
                    />
                    <span className="text-xs font-medium">Yes</span>
                  </div>
                  <div
                    className={`flex items-center space-x-2 px-2 py-2 rounded-lg ${
                      !poll.user_response?.answer
                        ? "bg-red-50 border border-red-200"
                        : "bg-gray-50 border border-gray-200"
                    }`}
                  >
                    <XCircle
                      className={`h-3 w-3 ${!poll.user_response?.answer ? "text-red-600" : "text-gray-400"}`}
                    />
                    <span className="text-xs font-medium">No</span>
                  </div>
                </div>

                {/* Results Bar */}
                {totalVotes > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-4">
                        <span className="text-green-600 font-medium">Yes {yesPercentage}%</span>
                        <span className="text-red-600 font-medium">No {noPercentage}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div className="h-full flex">
                        <div
                          className="bg-green-500 transition-all duration-500"
                          style={{ width: `${yesPercentage}%` }}
                        />
                        <div className="bg-red-500 transition-all duration-500" style={{ width: `${noPercentage}%` }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 mb-3 flex-1">
                <Button
                  onClick={() => handleVote(true)}
                  disabled={isVoting}
                  variant="outline"
                  className="flex items-center justify-center space-x-1 h-8 border-green-200 hover:bg-green-50 hover:border-green-300 text-green-700 font-medium text-xs"
                >
                  <CheckCircle className="h-3 w-3" />
                  <span>Yes</span>
                  {totalVotes > 0 && <span className="text-xs">({yesPercentage}%)</span>}
                </Button>
                <Button
                  onClick={() => handleVote(false)}
                  disabled={isVoting}
                  variant="outline"
                  className="flex items-center justify-center space-x-1 h-8 border-red-200 hover:bg-red-50 hover:border-red-300 text-red-700 font-medium text-xs"
                >
                  <XCircle className="h-3 w-3" />
                  <span>No</span>
                  {totalVotes > 0 && <span className="text-xs">({noPercentage}%)</span>}
                </Button>
              </div>
            )}

            {/* Bottom Stats */}
            <div className="flex items-center justify-between text-xs text-gray-500 mt-auto">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  <Users className="h-3 w-3" />
                  <span>{totalVotes.toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{new Date(poll.created_at).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}</span>
                </div>
              </div>
              {hasVoted && (
                <Badge variant="outline" className="text-xs">
                  Voted
                </Badge>
              )}
            </div>

            {/* Success/Error Messages */}
            {message && (
              <div
                className={`mt-2 p-2 rounded text-xs ${
                  message.type === "success"
                    ? "bg-green-50 border border-green-200 text-green-800"
                    : "bg-red-50 border border-red-200 text-red-800"
                }`}
              >
                {message.text}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
