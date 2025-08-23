"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Users, TrendingUp, Clock, Check } from "lucide-react"
import { votePoll } from "@/lib/actions/polls"
import Image from "next/image"
import { PollWithResponses, PollOption } from "@/lib/types/poll"

interface MarketPollCardProps {
  poll: PollWithResponses
}

export default function MarketPollCard({ poll }: MarketPollCardProps) {
  const [isVoting, setIsVoting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleVote = async (answer: boolean | string) => {
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

  const hasVoted = !!poll.user_response
  const isBinaryPoll = poll.poll_type === 'binary'

  // Debug logging
  console.log('Poll data:', {
    id: poll.id,
    poll_type: poll.poll_type,
    options: poll.options,
    optionsLength: poll.options?.length,
    hasVoted,
    isBinaryPoll
  })

  // For binary polls
  const yesPercentage = isBinaryPoll && poll.vote_counts ? getPercentage(poll.vote_counts.yes, poll.vote_counts.total) : 0
  const noPercentage = isBinaryPoll && poll.vote_counts ? getPercentage(poll.vote_counts.no, poll.vote_counts.total) : 0
  const totalVotes = poll.vote_counts?.total || 0

  // For multiple-option polls
  const getSelectedOption = () => {
    if (!isBinaryPoll && poll.user_response && 'option_id' in poll.user_response) {
      return poll.options?.find(opt => opt.id === poll.user_response.option_id)
    }
    return null
  }

  const getWinningOption = () => {
    if (!isBinaryPoll && poll.option_vote_counts) {
      return Object.entries(poll.option_vote_counts).reduce((max, [optionId, data]) => {
        return data.percentage > max.percentage ? { optionId, ...data } : max
      }, { optionId: '', percentage: 0 })
    }
    return null
  }

  const selectedOption = getSelectedOption()
  const winningOption = getWinningOption()

  // For binary polls - get user's vote
  const getUserVote = () => {
    if (isBinaryPoll && poll.user_response && 'answer' in poll.user_response) {
      return poll.user_response.answer
    }
    return null
  }

  const userVote = getUserVote()

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border border-gray-200 bg-white h-full">
      <CardContent className="p-3">
        <div className="flex flex-col h-full space-y-2">
          {/* Header with Image and Question */}
          <div className="flex items-start space-x-2">
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
                <h3 className="text-base font-medium text-gray-900 leading-tight pr-2">{poll.question}</h3>
                {totalVotes > 0 && (
                  <div className="flex-shrink-0">
                    <span className="text-sm font-bold text-gray-900">
                      {isBinaryPoll 
                        ? Math.max(yesPercentage, noPercentage)
                        : winningOption?.percentage || 0
                      }%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Voting Options */}
          {hasVoted ? (
            <div className="flex-1">
              {isBinaryPoll ? (
                // Binary poll voted state - Modern horizontal bar design
                <div className="space-y-3">
                  {/* Vote Distribution Bar */}
                  <div className="relative">
                    <div className="w-full h-8 bg-gray-100 rounded-lg overflow-hidden flex">
                      {/* Yes segment */}
                      <div 
                        className={`relative flex items-center justify-center transition-all duration-500 ${
                          userVote === true ? 'ring-2 ring-green-500 ring-offset-1' : ''
                        }`}
                        style={{ width: `${yesPercentage}%` }}
                      >
                        <div className="w-full h-full bg-green-500 flex items-center justify-center">
                          <span className="text-white text-xs font-semibold px-2">
                            YES {yesPercentage}%
                          </span>
                        </div>
                        {userVote === true && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Check className="h-4 w-4 text-white drop-shadow-sm" />
                          </div>
                        )}
                      </div>
                      
                      {/* No segment */}
                      <div 
                        className={`relative flex items-center justify-center transition-all duration-500 ${
                          userVote === false ? 'ring-2 ring-red-500 ring-offset-1' : ''
                        }`}
                        style={{ width: `${noPercentage}%` }}
                      >
                        <div className="w-full h-full bg-red-500 flex items-center justify-center">
                          <span className="text-white text-xs font-semibold px-2">
                            NO {noPercentage}%
                          </span>
                        </div>
                        {userVote === false && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Check className="h-4 w-4 text-white drop-shadow-sm" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Vote Counts */}
                  <div className="flex justify-between text-xs text-gray-600">
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>Yes: {poll.vote_counts?.yes || 0} votes</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span>No: {poll.vote_counts?.no || 0} votes</span>
                    </div>
                  </div>
                </div>
              ) : (
                // Multiple-option poll voted state
                <div className="space-y-2">
                  {poll.options?.map((option) => (
                    <div
                      key={option.id}
                      className={`flex items-center space-x-2 px-2 py-1 rounded text-xs ${
                        selectedOption?.id === option.id
                          ? "bg-blue-50 border border-blue-200"
                          : "bg-gray-50 border border-gray-200"
                      }`}
                    >
                      <CheckCircle
                        className={`h-3 w-3 ${selectedOption?.id === option.id ? "text-blue-600" : "text-gray-400"}`}
                      />
                      <span className="font-medium flex-1">{option.option_text}</span>
                      {poll.option_vote_counts?.[option.id] && (
                        <span className="text-xs text-gray-500">
                          {poll.option_vote_counts[option.id].percentage}%
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1">
              {isBinaryPoll ? (
                // Binary poll voting state
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleVote(true)}
                    disabled={isVoting}
                    variant="outline"
                    className="flex items-center justify-center space-x-1 h-7 border-green-200 hover:bg-green-50 hover:border-green-300 text-green-700 font-medium text-xs flex-1"
                  >
                    <CheckCircle className="h-3 w-3" />
                    <span>Yes</span>
                    {totalVotes > 0 && <span className="text-xs">({yesPercentage}%)</span>}
                  </Button>
                  <Button
                    onClick={() => handleVote(false)}
                    disabled={isVoting}
                    variant="outline"
                    className="flex items-center justify-center space-x-1 h-7 border-red-200 hover:bg-red-50 hover:border-red-300 text-red-700 font-medium text-xs flex-1"
                  >
                    <XCircle className="h-3 w-3" />
                    <span>No</span>
                    {totalVotes > 0 && <span className="text-xs">({noPercentage}%)</span>}
                  </Button>
                </div>
              ) : (
                // Multiple-option poll voting state
                <div className="space-y-2">
                  {poll.options && poll.options.length > 0 ? (
                    poll.options.map((option) => (
                      <Button
                        key={option.id}
                        onClick={() => handleVote(option.id)}
                        disabled={isVoting}
                        variant="outline"
                        className="flex items-center justify-center space-x-1 h-7 border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700 font-medium text-xs w-full"
                      >
                        <CheckCircle className="h-3 w-3" />
                        <span className="flex-1 text-left">{option.option_text}</span>
                        {poll.option_vote_counts?.[option.id] && (
                          <span className="text-xs text-gray-500">
                            ({poll.option_vote_counts[option.id].percentage}%)
                          </span>
                        )}
                      </Button>
                    ))
                  ) : (
                    <div className="text-center text-sm text-gray-500 py-2">
                      No options available
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Bottom Stats */}
          <div className="flex items-center justify-between text-xs text-gray-500 mt-auto">
            <div className="flex items-center space-x-2">
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
              className={`p-1.5 rounded text-xs ${
                message.type === "success"
                  ? "bg-green-50 border border-green-200 text-green-800"
                  : "bg-red-50 border border-red-200 text-red-800"
              }`}
            >
              {message.text}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
