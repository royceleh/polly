export interface Poll {
  id: string
  user_id: string
  question: string
  image_url?: string
  poll_type: 'binary' | 'multiple'
  created_at: string
}

export interface PollOption {
  id: string
  poll_id: string
  option_text: string
  created_at: string
}

export interface PollResponse {
  id: string
  poll_id: string
  user_id: string
  answer: boolean // For binary polls
  created_at: string
}

export interface PollOptionVote {
  id: string
  poll_id: string
  option_id: string
  user_id: string
  created_at: string
}

export interface PollWithResponses extends Poll {
  user_response?: PollResponse | PollOptionVote
  vote_counts?: {
    yes: number
    no: number
    total: number
  }
  options?: PollOption[]
  option_vote_counts?: {
    [optionId: string]: {
      count: number
      percentage: number
    }
  }
}

export interface CreatePollData {
  question: string
  image?: File
  poll_type: 'binary' | 'multiple'
  options?: string[] // For multiple-option polls
}

export interface PollFormState {
  error?: string
  success?: string
}
