"use client"

import { useState } from "react"
import { useFormState } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Plus, X, Upload } from "lucide-react"
import { createPoll } from "@/lib/actions/polls"

const initialState = {
  error: null,
  success: null,
}

export default function CreatePollForm() {
  const [state, formAction] = useFormState(createPoll, initialState)
  const [pollType, setPollType] = useState<'binary' | 'multiple'>('binary')
  const [options, setOptions] = useState<string[]>(['', ''])
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const addOption = () => {
    setOptions([...options, ''])
  }

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Create New Market</CardTitle>
          <p className="text-gray-600">Create a prediction market for the community to vote on</p>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-6">
            {/* Poll Type Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Poll Type</Label>
              <RadioGroup
                value={pollType}
                onValueChange={(value) => setPollType(value as 'binary' | 'multiple')}
                className="grid grid-cols-2 gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="binary" id="binary" />
                  <Label htmlFor="binary" className="cursor-pointer">
                    <div>
                      <div className="font-medium">Binary (Yes/No)</div>
                      <div className="text-sm text-gray-500">Simple yes or no question</div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="multiple" id="multiple" />
                  <Label htmlFor="multiple" className="cursor-pointer">
                    <div>
                      <div className="font-medium">Multiple Options</div>
                      <div className="text-sm text-gray-500">Choose from multiple options</div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Question */}
            <div className="space-y-2">
              <Label htmlFor="question" className="text-base font-medium">
                Question
              </Label>
              <Textarea
                id="question"
                name="question"
                placeholder="What would you like to ask the community?"
                className="min-h-[100px] resize-none"
                maxLength={120}
                required
              />
              <p className="text-sm text-gray-500">Maximum 120 characters</p>
            </div>

            {/* Poll Type Hidden Input */}
            <input type="hidden" name="pollType" value={pollType} />

            {/* Multiple Options */}
            {pollType === 'multiple' && (
              <div className="space-y-3">
                <Label className="text-base font-medium">Options</Label>
                <div className="space-y-3">
                  {options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        name="options"
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        maxLength={100}
                        required
                        className="flex-1"
                      />
                      {options.length > 2 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeOption(index)}
                          className="shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addOption}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Option
                  </Button>
                </div>
                <p className="text-sm text-gray-500">Minimum 2 options, maximum 100 characters each</p>
              </div>
            )}

            {/* Image Upload */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Image (Optional)</Label>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Input
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <Label
                    htmlFor="image-upload"
                    className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                  >
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-w-full max-h-full object-contain rounded"
                      />
                    ) : (
                      <div className="text-center">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Click to upload image</p>
                        <p className="text-xs text-gray-400">Max 5MB</p>
                      </div>
                    )}
                  </Label>
                </div>
              </div>
            </div>

            {/* Error/Success Messages */}
            {state.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{state.error}</p>
              </div>
            )}

            {state.success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">{state.success}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button type="submit" className="w-full" size="lg">
              Create Market
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
