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
    <Card className="group hover:scale-105 hover:shadow-lg transition-all duration-200 backdrop-blur-sm bg-white/90 border border-white/30 bg-gradient-to-br from-white/95 to-white/85 h-full cursor-pointer">
      <CardContent className="p-3">
        <div className="flex flex-col h-full space-y-2">
          {/* Header with Image and Question */}
          <div className="flex items-start space-x-2">
            {/* Poll Image/Icon */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100/50 backdrop-blur-sm border border-gray-200/30 flex items-center justify-center group-hover:bg-gray-100/70 transition-all duration-200">
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
                <h3 className="text-sm md:text-base font-medium text-gray-900 leading-tight pr-2">{poll.question}</h3>
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
                  {/* Yes option row */}
                  <div className="flex items-center space-x-3">
                    <div className="w-16 flex-shrink-0">
                      <span className="text-xs font-normal text-gray-900 truncate block">Yes</span>
                    </div>
                    <div className="flex-1 relative">
                      <div className="w-full h-4 bg-gray-100/50 backdrop-blur-sm border border-gray-200/30 rounded-full overflow-hidden group-hover:bg-gray-100/70 transition-all duration-200">
                        {yesPercentage > 0 ? (
                          <div 
                            className={`relative h-full transition-all duration-500 ${
                              userVote === true ? 'ring-1 ring-blue-500' : ''
                            }`}
                            style={{ width: `${yesPercentage}%` }}
                          >
                            <div className={`w-full h-full flex items-center justify-center relative ${
                              yesPercentage >= noPercentage ? 'bg-blue-500' : 'bg-gray-300'
                            }`}>
                              <span className="text-white text-sm font-medium">
                                {yesPercentage}%
                              </span>
                              {userVote === true && (
                                <div className="absolute right-1 top-1/2 transform -translate-y-1/2">
                                  <Check className="h-2.5 w-2.5 text-white drop-shadow-sm" />
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="h-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500 text-sm font-medium">
                              0%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* No option row */}
                  <div className="flex items-center space-x-3">
                    <div className="w-16 flex-shrink-0">
                      <span className="text-xs font-normal text-gray-900 truncate block">No</span>
                    </div>
                    <div className="flex-1 relative">
                      <div className="w-full h-4 bg-gray-100/50 backdrop-blur-sm border border-gray-200/30 rounded-full overflow-hidden group-hover:bg-gray-100/70 transition-all duration-200">
                        {noPercentage > 0 ? (
                          <div 
                            className={`relative h-full transition-all duration-500 ${
                              userVote === false ? 'ring-1 ring-blue-500' : ''
                            }`}
                            style={{ width: `${noPercentage}%` }}
                          >
                            <div className={`w-full h-full flex items-center justify-center relative ${
                              noPercentage >= yesPercentage ? 'bg-blue-500' : 'bg-gray-300'
                            }`}>
                              <span className="text-white text-sm font-medium">
                                {noPercentage}%
                              </span>
                              {userVote === false && (
                                <div className="absolute right-1 top-1/2 transform -translate-y-1/2">
                                  <Check className="h-2.5 w-2.5 text-white drop-shadow-sm" />
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="h-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500 text-sm font-medium">
                              0%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Multiple-option poll voted state
                <div className="space-y-3">
                  {(() => {
                    // Sort options by percentage (descending), then alphabetically for ties
                    const sortedOptions = poll.options?.slice().sort((a, b) => {
                      const aPercentage = poll.option_vote_counts?.[a.id]?.percentage || 0;
                      const bPercentage = poll.option_vote_counts?.[b.id]?.percentage || 0;
                      
                      if (aPercentage !== bPercentage) {
                        return bPercentage - aPercentage; // Descending by percentage
                      }
                      return a.option_text.localeCompare(b.option_text); // Alphabetical for ties
                    }) || [];
                    
                    // Get top 3 options, but always include user's selection if not in top 3
                    const top3Options = sortedOptions.slice(0, 3);
                    const userSelectedOption = selectedOption;
                    
                    // If user's selection is not in top 3, replace the last one
                    let displayOptions = top3Options;
                    if (userSelectedOption && !top3Options.find(opt => opt.id === userSelectedOption.id)) {
                      displayOptions = [...top3Options.slice(0, 2), userSelectedOption];
                    }
                    
                    return displayOptions.map((option) => {
                      const voteCount = poll.option_vote_counts?.[option.id]?.count || 0;
                      const percentage = poll.option_vote_counts?.[option.id]?.percentage || 0;
                      const isSelected = selectedOption?.id === option.id;
                      
                      // Find the winning option (highest percentage)
                      const winningPercentage = Math.max(...poll.options.map(opt => 
                        poll.option_vote_counts?.[opt.id]?.percentage || 0
                      ));
                      const isWinning = percentage === winningPercentage && percentage > 0;
                      
                      return (
                        <div key={option.id} className="flex items-center space-x-3">
                          <div className="w-20 flex-shrink-0">
                            <span className="text-xs font-normal text-gray-900 truncate block">{option.option_text}</span>
                          </div>
                          <div className="flex-1 relative">
                            <div className="w-full h-4 bg-gray-100/50 backdrop-blur-sm border border-gray-200/30 rounded-full overflow-hidden group-hover:bg-gray-100/70 transition-all duration-200">
                              {/* Bar segment */}
                              {voteCount > 0 ? (
                                <div
                                  className={`h-full transition-all duration-300 ${
                                    isWinning ? 'bg-blue-500' : 'bg-gray-300'
                                  }`}
                                  style={{ width: `${percentage}%` }}
                                />
                              ) : (
                                <div className="h-full bg-gray-200" style={{ width: '100%' }} />
                              )}
                              
                              {/* Percentage overlay */}
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className={`text-sm font-medium ${
                                  voteCount > 0 ? 'text-white drop-shadow-sm' : 'text-gray-500'
                                }`}>
                                  {voteCount === 0 ? '0%' : `${percentage}%`}
                                </span>
                              </div>
                              
                              {/* Selection indicator */}
                              {isSelected && (
                                <div className="absolute right-1 top-1/2 transform -translate-y-1/2">
                                  <Check className="h-2.5 w-2.5 text-white drop-shadow-sm" />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                  
                  {/* Show indicator if there are more options */}
                  {poll.options && poll.options.length > 3 && (
                    <div className="text-center pt-2">
                      <span className="text-xs text-gray-500">
                        +{poll.options.length - 3} more options
                      </span>
                    </div>
                  )}
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
                    className="flex items-center justify-center space-x-1 h-7 border-gray-200/50 hover:bg-gray-50/80 hover:border-gray-300/70 text-gray-700 font-medium text-xs flex-1 backdrop-blur-sm bg-white/60 hover:scale-105 transition-all duration-200"
                  >
                    <CheckCircle className="h-3 w-3" />
                    <span>Yes</span>
                    {totalVotes > 0 && <span className="text-xs">({yesPercentage}%)</span>}
                  </Button>
                  <Button
                    onClick={() => handleVote(false)}
                    disabled={isVoting}
                    variant="outline"
                    className="flex items-center justify-center space-x-1 h-7 border-gray-200/50 hover:bg-gray-50/80 hover:border-gray-300/70 text-gray-700 font-medium text-xs flex-1 backdrop-blur-sm bg-white/60 hover:scale-105 transition-all duration-200"
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
                    poll.options.map((option) => {
                      const voteCount = poll.option_vote_counts?.[option.id]?.count || 0;
                      const percentage = poll.option_vote_counts?.[option.id]?.percentage || 0;
                      
                      return (
                        <Button
                          key={option.id}
                          onClick={() => handleVote(option.id)}
                          disabled={isVoting}
                          variant="outline"
                          className="flex items-center justify-between h-8 border-gray-200/50 hover:bg-gray-50/80 hover:border-gray-300/70 text-gray-700 font-medium text-xs w-full px-3 backdrop-blur-sm bg-white/60 hover:scale-105 transition-all duration-200"
                        >
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-3 w-3" />
                            <span className="text-left">{option.option_text}</span>
                          </div>
                          {voteCount > 0 && (
                            <span className="text-xs text-gray-500">
                              {voteCount} votes ({percentage}%)
                            </span>
                          )}
                        </Button>
                      );
                    })
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
              <Badge variant="outline" className="text-xs backdrop-blur-sm bg-white/60 border-white/30">
                Voted
              </Badge>
            )}
          </div>

          {/* Success/Error Messages */}
          {message && (
            <div
              className={`p-1.5 rounded text-xs backdrop-blur-sm border ${
                message.type === "success"
                  ? "bg-green-50/80 border-green-200/50 text-green-800"
                  : "bg-red-50/80 border-red-200/50 text-red-800"
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
