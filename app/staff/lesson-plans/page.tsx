import { StaffSidebar } from "@/shared/components/layout/StaffSidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import Link from "next/link"

const mockLessonPlans = [
  {
    id: "1",
    title: "Introduction to Algebra",
    description: "Basic algebraic concepts and problem-solving techniques",
    status: "published",
    program: { name: "Advanced Mathematics" },
    lesson_date: "2024-01-20",
    duration_minutes: 90,
    objectives: ["Understand variables", "Solve basic equations", "Apply algebraic thinking"],
  },
  {
    id: "2",
    title: "Chemical Reactions Lab",
    description: "Hands-on exploration of chemical reactions and safety protocols",
    status: "draft",
    program: { name: "Science Laboratory" },
    lesson_date: "2024-01-25",
    duration_minutes: 120,
    objectives: ["Identify reaction types", "Follow safety procedures", "Record observations"],
  },
]

export default function InstructorLessonPlansPage() {
  const lessonPlans = mockLessonPlans

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "draft":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <StaffSidebar />

      <div className="lg:pl-64">
        <main className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Lesson Plans</h1>
              <p className="text-muted-foreground mt-2">Create and manage your lesson plans</p>
            </div>
            <Button asChild>
              <Link href="/staff/lesson-plans/new">
                <span className="mr-2">➕</span>
                New Lesson Plan
              </Link>
            </Button>
          </div>

          {/* Lesson Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lessonPlans && lessonPlans.length > 0 ? (
              lessonPlans.map((plan) => (
                <Card key={plan.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{plan.title}</CardTitle>
                      <Badge className={getStatusColor(plan.status)}>{plan.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {plan.description || "No description provided"}
                    </p>

                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <span className="mr-2">📚</span>
                        {plan.program?.name || "No program assigned"}
                      </div>

                      <div className="flex items-center text-sm text-muted-foreground">
                        <span className="mr-2">📅</span>
                        {new Date(plan.lesson_date).toLocaleDateString()}
                      </div>

                      {plan.duration_minutes && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <span className="mr-2">⏰</span>
                          {plan.duration_minutes} minutes
                        </div>
                      )}
                    </div>

                    {plan.objectives && plan.objectives.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Objectives:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {plan.objectives.slice(0, 2).map((objective, index) => (
                            <li key={index} className="flex items-start">
                              <span className="mr-2">•</span>
                              <span className="line-clamp-1">{objective}</span>
                            </li>
                          ))}
                          {plan.objectives.length > 2 && (
                            <li className="text-xs">+{plan.objectives.length - 2} more</li>
                          )}
                        </ul>
                      </div>
                    )}

                    <div className="flex gap-2 pt-4">
                      <Button variant="outline" size="sm" asChild className="flex-1 bg-transparent">
                        <Link href={`/staff/lesson-plans/${plan.id}`}>View</Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild className="flex-1 bg-transparent">
                        <Link href={`/staff/lesson-plans/${plan.id}/edit`}>Edit</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full">
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="text-center">
                      <span className="text-4xl mb-4 block">📅</span>
                      <h3 className="text-lg font-medium text-foreground mb-2">No lesson plans yet</h3>
                      <p className="text-muted-foreground mb-6">
                        Create your first lesson plan to get started with structured teaching.
                      </p>
                      <Button asChild>
                        <Link href="/staff/lesson-plans/new">
                          <span className="mr-2">➕</span>
                          Create Lesson Plan
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
