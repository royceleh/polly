"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Vote, TrendingUp, Trophy, ArrowLeft, Gift, Filter, Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import MarketPollCard from "@/components/market-poll-card"
import { useState } from "react"
import { PollWithResponses } from "@/lib/types/poll"

interface PollsClientProps {
  initialPolls: PollWithResponses[]
  initialUserPoints: number
}

export default function PollsClient({ initialPolls, initialUserPoints }: PollsClientProps) {
  const [polls] = useState<PollWithResponses[]>(initialPolls)
  const [userPoints] = useState(initialUserPoints)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "binary" | "multiple">("all")
  const [showFilters, setShowFilters] = useState(false)

  // Filter polls based on search term and filter type
  const filteredPolls = polls.filter((poll) => {
    const matchesSearch = poll.question.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === "all" || poll.poll_type === filterType
    return matchesSearch && matchesFilter
  })

  // Separate polls by voting status
  const unvotedPolls = filteredPolls.filter((poll) => !poll.user_response)
  const votedPolls = filteredPolls.filter((poll) => poll.user_response)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild className="p-2">
                <Link href="/">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <TrendingUp className="h-6 w-6 mr-2 text-blue-600" />
                  Markets
                </h1>
                <p className="text-sm text-gray-600">
                  {userPoints} points • {unvotedPolls.length} active markets
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard">
                  <Trophy className="h-4 w-4 mr-1" />
                  Dashboard
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/rewards">
                  <Gift className="h-4 w-4 mr-1" />
                  Rewards
                </Link>
              </Button>
              <Button asChild className="bg-blue-600 hover:bg-blue-700" size="sm">
                <Link href="/polls/create">
                  <Plus className="h-4 w-4 mr-1" />
                  Create Market
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Filters and Search */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search markets..." 
                className="pl-10 w-64 bg-white border-gray-200" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className={`flex items-center ${showFilters ? 'bg-blue-50 border-blue-200' : 'bg-transparent'}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-1" />
              Filter
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs">
              {filteredPolls.length} of {polls.length} markets
            </Badge>
          </div>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Poll Type:</span>
              <div className="flex items-center space-x-2">
                {[
                  { value: "all", label: "All" },
                  { value: "binary", label: "Binary" },
                  { value: "multiple", label: "Multiple Choice" }
                ].map((option) => (
                  <Button
                    key={option.value}
                    variant={filterType === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterType(option.value as any)}
                    className="text-xs"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {filteredPolls.length === 0 ? (
          <div className="text-center py-16">
            <Card className="max-w-md mx-auto">
              <CardContent className="p-8">
                <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {polls.length === 0 ? "No markets available" : "No markets match your search"}
                </h3>
                <p className="text-gray-600 mb-6">
                  {polls.length === 0 
                    ? "Be the first to create a prediction market and start engaging with the community!"
                    : "Try adjusting your search terms or filters to find what you're looking for."
                  }
                </p>
                {polls.length === 0 && (
                  <Button asChild className="bg-blue-600 hover:bg-blue-700">
                    <Link href="/polls/create">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Market
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Active Markets (Unvoted) */}
            {unvotedPolls.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Vote className="h-5 w-5 mr-2 text-green-600" />
                    Active Markets
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {unvotedPolls.length}
                    </Badge>
                  </h2>
                  <p className="text-sm text-gray-600">Earn 1 point per prediction</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {unvotedPolls.map((poll) => (
                    <MarketPollCard key={poll.id} poll={poll} />
                  ))}
                </div>
              </div>
            )}

            {/* Your Predictions (Voted) */}
            {votedPolls.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Trophy className="h-5 w-5 mr-2 text-yellow-600" />
                    Your Predictions
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {votedPolls.length}
                    </Badge>
                  </h2>
                  <p className="text-sm text-gray-600">Markets you've participated in</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {votedPolls.map((poll) => (
                    <MarketPollCard key={poll.id} poll={poll} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
