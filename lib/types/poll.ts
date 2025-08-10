export interface Poll {
  id: string
  user_id: string
  question: string
  image_url?: string
  created_at: string
}

export interface CreatePollData {
  question: string
  image?: File
}

export interface PollFormState {
  error?: string
  success?: string
}
