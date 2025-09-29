import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

const mockDocuments = [
  {
    id: "1",
    name: "Medical Form - John Doe",
    document_type: "medical_form",
    status: "approved",
    activity: { name: "Advanced Mathematics" },
    created_at: "2024-01-10T10:00:00Z",
    reviewed_at: "2024-01-12T14:30:00Z",
    reviewer: { first_name: "Dr. Sarah", last_name: "Johnson" },
  },
  {
    id: "2",
    name: "Emergency Contact Information",
    document_type: "emergency_contact",
    status: "pending",
    activity: { name: "Science Laboratory" },
    created_at: "2024-01-15T09:15:00Z",
  },
  {
    id: "3",
    name: "Photo Release Form",
    document_type: "photo_release",
    status: "rejected",
    activity: { name: "Creative Arts" },
    created_at: "2024-01-18T11:30:00Z",
    notes: "Form is incomplete. Please fill out all required fields and resubmit.",
  },
  {
    id: "4",
    name: "Insurance Information",
    document_type: "insurance_info",
    status: "missing",
    activity: { name: "Advanced Mathematics" },
  },
]

export default function StudentDocumentsPage() {
  const documents = mockDocuments

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "missing":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return "✅"
      case "pending":
        return "⏰"
      case "rejected":
        return "❌"
      case "missing":
        return "⚠️"
      default:
        return "📄"
    }
  }

  // Group documents by status
  const missingDocs = documents?.filter((doc) => doc.status === "missing") || []
  const pendingDocs = documents?.filter((doc) => doc.status === "pending") || []
  const approvedDocs = documents?.filter((doc) => doc.status === "approved") || []
  const rejectedDocs = documents?.filter((doc) => doc.status === "rejected") || []

  return (
    <div className="min-h-screen bg-background">
      <main className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Documents</h1>
              <p className="text-muted-foreground mt-2">Manage your required documents and submissions</p>
            </div>
            <Button asChild>
              <Link href="/student/documents/upload">
                <span className="mr-2">📤</span>
                Upload Document
              </Link>
            </Button>
          </div>

          {/* Missing Documents Alert */}
          {missingDocs.length > 0 && (
            <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 mb-8">
              <CardHeader>
                <CardTitle className="flex items-center text-red-800 dark:text-red-200">
                  <span className="mr-2">⚠️</span>
                  Missing Documents - Action Required
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-700 dark:text-red-300 mb-4">
                  You have {missingDocs.length} missing documents that need to be submitted:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {missingDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 bg-white dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                    >
                      <h4 className="font-medium text-red-800 dark:text-red-200">{doc.name}</h4>
                      <p className="text-sm text-red-600 dark:text-red-400 capitalize">
                        {doc.document_type.replace("_", " ")}
                      </p>
                      {doc.activity && (
                        <p className="text-sm text-red-600 dark:text-red-400">Program: {doc.activity.name}</p>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Button asChild variant="destructive">
                    <Link href="/student/documents/upload">Submit Missing Documents</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Document Status Sections */}
          <div className="space-y-8">
            {/* Pending Documents */}
            {pendingDocs.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <span className="mr-2 text-yellow-600">⏰</span>
                  Under Review ({pendingDocs.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingDocs.map((doc) => (
                    <Card key={doc.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg">{doc.name}</CardTitle>
                          <Badge className={getStatusColor(doc.status)}>
                            <span className="mr-1">{getStatusIcon(doc.status)}</span>
                            {doc.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <p className="capitalize">{doc.document_type.replace("_", " ")}</p>
                          {doc.activity && <p>Program: {doc.activity.name}</p>}
                          <p>Submitted: {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'N/A'}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Approved Documents */}
            {approvedDocs.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <span className="mr-2 text-green-600">✅</span>
                  Approved ({approvedDocs.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {approvedDocs.map((doc) => (
                    <Card key={doc.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg">{doc.name}</CardTitle>
                          <Badge className={getStatusColor(doc.status)}>
                            <span className="mr-1">{getStatusIcon(doc.status)}</span>
                            {doc.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <p className="capitalize">{doc.document_type.replace("_", " ")}</p>
                          {doc.activity && <p>Program: {doc.activity.name}</p>}
                          {doc.reviewed_at && doc.reviewer && (
                            <p className="text-green-600 dark:text-green-400">
                              Approved by {doc.reviewer.first_name} {doc.reviewer.last_name}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Rejected Documents */}
            {rejectedDocs.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <span className="mr-2 text-red-600">❌</span>
                  Rejected ({rejectedDocs.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rejectedDocs.map((doc) => (
                    <Card key={doc.id} className="border-red-200 dark:border-red-800">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg">{doc.name}</CardTitle>
                          <Badge className={getStatusColor(doc.status)}>
                            <span className="mr-1">{getStatusIcon(doc.status)}</span>
                            {doc.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <p className="text-muted-foreground capitalize">{doc.document_type.replace("_", " ")}</p>
                          {doc.activity && <p className="text-muted-foreground">Program: {doc.activity.name}</p>}
                          {doc.notes && (
                            <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                              <p className="text-red-700 dark:text-red-300 text-sm">
                                <strong>Reason:</strong> {doc.notes}
                              </p>
                            </div>
                          )}
                          <Button size="sm" variant="outline" asChild className="w-full mt-3 bg-transparent">
                            <Link href="/student/documents/upload">Resubmit</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {documents && documents.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="text-center">
                    <span className="text-4xl mb-4 block">📄</span>
                    <h3 className="text-lg font-medium text-foreground mb-2">No documents yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Upload your required documents to get started with your activities.
                    </p>
                    <Button asChild>
                      <Link href="/student/documents/upload">
                        <span className="mr-2">📤</span>
                        Upload First Document
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
  )
}
