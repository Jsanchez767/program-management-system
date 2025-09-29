"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

const mockActivities = [
  { id: "1", name: "Advanced Mathematics" },
  { id: "2", name: "Science Laboratory" },
  { id: "3", name: "Creative Arts" },
]

export default function UploadDocumentPage() {
  const [formData, setFormData] = useState({
    name: "",
    document_type: "",
    activity_id: "",
    notes: "",
  })
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const documentTypes = [
    { value: "medical_form", label: "Medical Form" },
    { value: "permission_slip", label: "Permission Slip" },
    { value: "emergency_contact", label: "Emergency Contact" },
    { value: "insurance_info", label: "Insurance Information" },
    { value: "photo_release", label: "Photo Release" },
    { value: "transcript", label: "Transcript" },
    { value: "identification", label: "Identification" },
    { value: "other", label: "Other" },
  ]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Check file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB")
        return
      }

      // Check file type
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/gif",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ]

      if (!allowedTypes.includes(selectedFile.type)) {
        setError("Please upload a PDF, image, or Word document")
        return
      }

      setFile(selectedFile)
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError("Please select a file to upload")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      router.push("/participant/documents")
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="p-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" size="icon" asChild>
              <Link href="/participant/documents">
                <span>←</span>
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Upload Document</h1>
              <p className="text-muted-foreground mt-2">Submit a document for review and approval</p>
            </div>
          </div>

          {/* Form */}
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="mr-2">📄</span>
                Document Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Document Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateFormData("name", e.target.value)}
                    placeholder="Enter document name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document_type">Document Type *</Label>
                  <Select
                    value={formData.document_type}
                    onValueChange={(value) => updateFormData("document_type", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="program">Related Program (Optional)</Label>
                  <Select value={formData.activity_id} onValueChange={(value) => updateFormData("activity_id", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an activity (if applicable)" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockActivities.map((activity) => (
                        <SelectItem key={activity.id} value={activity.id}>
                          {activity.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file">File Upload *</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6">
                    <div className="text-center">
                      <span className="text-4xl mb-4 block">📤</span>
                      <div className="space-y-2">
                        <Label htmlFor="file" className="cursor-pointer">
                          <span className="text-primary hover:text-primary/80">Choose a file</span> or drag and drop
                        </Label>
                        <Input
                          id="file"
                          type="file"
                          onChange={handleFileChange}
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                          className="hidden"
                          required
                        />
                        <p className="text-sm text-muted-foreground">PDF, Word documents, or images up to 10MB</p>
                      </div>
                    </div>
                  </div>
                  {file && (
                    <div className="mt-2 p-3 bg-muted rounded-lg">
                      <p className="text-sm">
                        <strong>Selected:</strong> {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => updateFormData("notes", e.target.value)}
                    placeholder="Any additional information about this document"
                    rows={3}
                  />
                </div>

                {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

                <div className="flex gap-4">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Uploading..." : "Upload Document"}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href="/participant/documents">Cancel</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
  )
}
