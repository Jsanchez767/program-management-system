import { AdminSidebar } from "@/shared/components/layout/AdminSidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import Link from "next/link"

const mockDocuments = [
  {
    id: "1",
    name: "Medical Form - John Doe",
    document_type: "medical_form",
    status: "pending",
    student: { first_name: "John", last_name: "Doe", email: "john.doe@example.com" },
    program: { name: "Advanced Mathematics" },
    created_at: "2024-01-15T10:00:00Z",
    notes: "Please review for completeness",
  },
  {
    id: "2",
    name: "Emergency Contact - Jane Smith",
    document_type: "emergency_contact",
    status: "approved",
    student: { first_name: "Jane", last_name: "Smith", email: "jane.smith@example.com" },
    program: { name: "Science Laboratory" },
    created_at: "2024-01-12T14:30:00Z",
    reviewed_at: "2024-01-13T09:15:00Z",
    reviewer: { first_name: "Dr. Sarah", last_name: "Johnson" },
  },
  {
    id: "3",
    name: "Photo Release - Mike Wilson",
    document_type: "photo_release",
    status: "rejected",
    student: { first_name: "Mike", last_name: "Wilson", email: "mike.wilson@example.com" },
    program: { name: "Creative Arts" },
    created_at: "2024-01-18T11:30:00Z",
    notes: "Form is incomplete. Please fill out all required fields.",
  },
]

export default function AdminDocumentsPage() {
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

  // Group documents by status for better organization
  const pendingDocs = documents?.filter((doc) => doc.status === "pending") || []
  const approvedDocs = documents?.filter((doc) => doc.status === "approved") || []
  const rejectedDocs = documents?.filter((doc) => doc.status === "rejected") || []
  const missingDocs = documents?.filter((doc) => doc.status === "missing") || []

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />

      <div className="lg:pl-64">
        <main className="p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Document Management</h1>
            <p className="text-muted-foreground mt-2">Review and manage student document submissions</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
                    <p className="text-2xl font-bold">{pendingDocs.length}</p>
                  </div>
                  <div className="h-8 w-8 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                    <span className="text-yellow-600 dark:text-yellow-400">📄</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Approved</p>
                    <p className="text-2xl font-bold">{approvedDocs.length}</p>
                  </div>
                  <div className="h-8 w-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <span className="text-green-600 dark:text-green-400">📄</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                    <p className="text-2xl font-bold">{rejectedDocs.length}</p>
                  </div>
                  <div className="h-8 w-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                    <span className="text-red-600 dark:text-red-400">📄</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Missing</p>
                    <p className="text-2xl font-bold">{missingDocs.length}</p>
                  </div>
                  <div className="h-8 w-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 dark:text-orange-400">📄</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Documents - Priority Section */}
          {pendingDocs.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-yellow-700 dark:text-yellow-300">
                Pending Review ({pendingDocs.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingDocs.map((doc) => (
                  <Card key={doc.id} className="border-yellow-200 dark:border-yellow-800">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{doc.name}</CardTitle>
                        <Badge className={getStatusColor(doc.status)}>{doc.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center text-muted-foreground">
                          <span className="mr-2">👤</span>
                          {doc.student?.first_name} {doc.student?.last_name}
                        </div>

                        <div className="flex items-center text-muted-foreground">
                          <span className="mr-2">📄</span>
                          <span className="capitalize">{doc.document_type.replace("_", " ")}</span>
                        </div>

                        {doc.program && (
                          <div className="flex items-center text-muted-foreground">
                            <span className="mr-2">📚</span>
                            {doc.program.name}
                          </div>
                        )}

                        <div className="flex items-center text-muted-foreground">
                          <span className="mr-2">📅</span>
                          Submitted {new Date(doc.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      {doc.notes && (
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm">{doc.notes}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button size="sm" asChild className="flex-1">
                          <Link href={`/admin/documents/${doc.id}/review`}>
                            <span className="mr-2">👁️</span>
                            Review
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* All Documents */}
          <div className="space-y-8">
            {/* Approved Documents */}
            {approvedDocs.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Approved Documents ({approvedDocs.length})</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {approvedDocs.slice(0, 6).map((doc) => (
                    <Card key={doc.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg">{doc.name}</CardTitle>
                          <Badge className={getStatusColor(doc.status)}>{doc.status}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <span className="mr-2">👤</span>
                          {doc.student?.first_name} {doc.student?.last_name}
                        </div>
                        <div className="flex items-center capitalize">
                          <span className="mr-2">📄</span>
                          {doc.document_type.replace("_", " ")}
                        </div>
                        {doc.reviewer && (
                          <div className="text-green-600 dark:text-green-400">
                            Approved by {doc.reviewer.first_name} {doc.reviewer.last_name}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {approvedDocs.length > 6 && (
                  <div className="mt-4">
                    <Button variant="outline">View All Approved Documents</Button>
                  </div>
                )}
              </div>
            )}

            {/* Rejected Documents */}
            {rejectedDocs.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Rejected Documents ({rejectedDocs.length})</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rejectedDocs.slice(0, 6).map((doc) => (
                    <Card key={doc.id} className="border-red-200 dark:border-red-800">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg">{doc.name}</CardTitle>
                          <Badge className={getStatusColor(doc.status)}>{doc.status}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex items-center text-muted-foreground">
                          <span className="mr-2">👤</span>
                          {doc.student?.first_name} {doc.student?.last_name}
                        </div>
                        <div className="flex items-center text-muted-foreground capitalize">
                          <span className="mr-2">📄</span>
                          {doc.document_type.replace("_", " ")}
                        </div>
                        {doc.notes && (
                          <div className="p-2 bg-red-50 dark:bg-red-950 rounded text-red-700 dark:text-red-300">
                            <strong>Reason:</strong> {doc.notes}
                          </div>
                        )}
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
                    <p className="text-muted-foreground">
                      Student document submissions will appear here for review and approval.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
