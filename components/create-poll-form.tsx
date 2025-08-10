"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Loader2, Upload, X, TrendingUp } from "lucide-react"
import { createPoll } from "@/lib/actions/polls"
import { useState, useRef } from "react"
import Image from "next/image"

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending} className="w-full bg-blue-600 hover:bg-blue-700">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creating Market...
        </>
      ) : (
        <>
          <TrendingUp className="mr-2 h-4 w-4" />
          Create Market
        </>
      )}
    </Button>
  )
}

export default function CreatePollForm() {
  const router = useRouter()
  const [state, formAction] = useActionState(createPoll, null)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [questionLength, setQuestionLength] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success) {
      // Reset form and state
      setSelectedImage(null)
      setImagePreview(null)
      setQuestionLength(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      if (formRef.current) {
        formRef.current.reset()
      }

      // Redirect to polls page after successful creation
      setTimeout(() => {
        router.push("/polls")
      }, 1500)
    }
  }, [state?.success, router])

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleQuestionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuestionLength(event.target.value.length)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
          Create Prediction Market
        </CardTitle>
        <p className="text-sm text-gray-600">Ask a yes/no question that the community can predict on</p>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="space-y-6">
          {state?.error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-700 px-4 py-3 rounded">{state.error}</div>
          )}

          {state?.success && (
            <div className="bg-green-500/10 border border-green-500/50 text-green-700 px-4 py-3 rounded">
              {state.success}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="question">Market Question</Label>
            <Textarea
              id="question"
              name="question"
              placeholder="Will [event] happen by [date]? (Yes/No question)"
              required
              maxLength={120}
              onChange={handleQuestionChange}
              className="resize-none"
              rows={3}
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>Create a clear yes/no prediction question</span>
              <span className={questionLength > 120 ? "text-red-500" : ""}>{questionLength}/120</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Market Image (Optional)</Label>
            <div className="space-y-4">
              {imagePreview ? (
                <div className="relative">
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                    <Image
                      src={imagePreview || "/placeholder.svg"}
                      alt="Market image preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">Click to upload an image</p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
                </div>
              )}
              <Input
                ref={fileInputRef}
                id="image"
                name="image"
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-medium mb-2 text-blue-900">Market Details</h3>
            <div className="space-y-2 text-sm text-blue-800">
              <p>• Prediction Type: Yes/No</p>
              <p>• Participants earn 1 point for making a prediction</p>
              <p>• Results are determined by community consensus</p>
            </div>
          </div>

          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  )
}
