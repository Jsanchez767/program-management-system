"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { AdminSidebar } from "@/shared/components/layout/AdminSidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { Label } from "@/shared/components/ui/label"
import { Textarea } from "@/shared/components/ui/textarea"
import { Badge } from "@/shared/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, FileText, User, BookOpen, Calendar, Download, Check, X } from "lucide-react"
import Link from "next/link"

export default function ReviewDocumentPage() {
  const [document, setDocument] = useState<any>(null)
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    const loadDocument = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("documents")
          .select(`
            *,
            student:profiles!documents_student_id_fkey(first_name, last_name, email),
            program:programs(name),
            reviewer:profiles!documents_reviewed_by_fkey(first_name, last_name)
          `)
          .eq("id", params.id)
          .single()

        if (error) throw error
        setDocument(data)
        setNotes(data.notes || "")
      } catch (error: any) {
        setError(error.message)
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      loadDocument()
    }
  }, [params.id])

  const handleApprove = async () => {
    await updateDocumentStatus("approved")
  }

  const handleReject = async () => {
    if (!notes.trim()) {
      setError("Please provide a reason for rejection")
      return
    }
    await updateDocumentStatus("rejected")
  }

  const updateDocumentStatus = async (status: "approved" | "rejected") => {
    setIsSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { error } = await supabase
        .from("documents")
        .update({
          status,
          notes: notes.trim() || null,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", params.id)

      if (error) throw error

      router.push("/admin/documents")
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const downloadDocument = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.storage.from("documents").download(document.file_path)

      if (error) throw error

      // Create download link
      const url = URL.createObjectURL(data)
      const a = document.createElement("a")
      a.href = url
      a.download = document.file_name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error: any) {
      setError(`Download failed: ${error.message}`)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminSidebar />
        <div className="lg:pl-64">
          <main className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading document...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (error && !document) {
    return (
      <div className="min-h-screen bg-background">
        <AdminSidebar />
        <div className="lg:pl-64">
          <main className="p-6">
            <div className="text-center">
              <p className="text-destructive">{error}</p>
              <Button asChild className="mt-4">
                <Link href="/admin/documents">Back to Documents</Link>
              </Button>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />

      <div className="lg:pl-64">
        <main className="p-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" size="icon" asChild>
              <Link href="/admin/documents">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Review Document</h1>
              <p className="text-muted-foreground mt-2">Review and approve or reject student document submission</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Document Details */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl">{document?.name}</CardTitle>
                    <Badge className={getStatusColor(document?.status)}>{document?.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center text-sm">
                        <User className="mr-2 h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {document?.student?.first_name} {document?.student?.last_name}
                          </p>
                          <p className="text-muted-foreground">{document?.student?.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center text-sm">
                        <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium capitalize">{document?.document_type.replace("_", " ")}</p>
                          <p className="text-muted-foreground">{document?.file_name}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {document?.program && (
                        <div className="flex items-center text-sm">
                          <BookOpen className="mr-2 h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Program</p>
                            <p className="text-muted-foreground">{document.program.name}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center text-sm">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Submitted</p>
                          <p className="text-muted-foreground">{new Date(document?.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {document?.notes && (
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">Student Notes:</h4>
                      <p className="text-sm">{document.notes}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={downloadDocument} variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Download File
                    </Button>
                    <div className="text-sm text-muted-foreground flex items-center">
                      Size: {(document?.file_size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Review Actions */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Review Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="notes">Review Notes</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add notes about your review decision..."
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">Required for rejection. Optional for approval.</p>
                  </div>

                  {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

                  <div className="space-y-2">
                    <Button
                      onClick={handleApprove}
                      disabled={isSubmitting || document?.status !== "pending"}
                      className="w-full"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      {isSubmitting ? "Processing..." : "Approve Document"}
                    </Button>

                    <Button
                      onClick={handleReject}
                      disabled={isSubmitting || document?.status !== "pending"}
                      variant="destructive"
                      className="w-full"
                    >
                      <X className="mr-2 h-4 w-4" />
                      {isSubmitting ? "Processing..." : "Reject Document"}
                    </Button>
                  </div>

                  {document?.status !== "pending" && (
                    <div className="p-3 bg-muted rounded-lg text-sm">
                      <p>
                        This document has already been <span className="font-medium">{document.status}</span>
                        {document?.reviewer && (
                          <>
                            {" "}
                            by {document.reviewer.first_name} {document.reviewer.last_name}
                          </>
                        )}
                        {document?.reviewed_at && <> on {new Date(document.reviewed_at).toLocaleDateString()}</>}.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
