// Real-world examples of Realtime improvements in your program management system

// ===========================================
// 1. ADMIN DASHBOARD - LIVE METRICS
// ===========================================

export function LiveAdminDashboard() {
  const user = useUser()
  const organizationId = user?.user_metadata?.organization_id
  
  // These update automatically as students enroll/complete programs
  const liveStats = useRealtimeDashboard(organizationId)
  
  return (
    <div className="dashboard-grid">
      {/* These numbers update in real-time without page refresh */}
      <MetricCard 
        title="Today's Enrollments" 
        value={liveStats.todayEnrollments}
        trend="↗️ +3 in last hour"
        color="green"
      />
      
      <MetricCard 
        title="Active Students" 
        value={liveStats.activeStudents}
        trend="📈 Growing"
        color="blue"  
      />
      
      <MetricCard 
        title="Program Completions" 
        value={liveStats.completions}
        trend="✅ +5 this week"
        color="purple"
      />
    </div>
  )
}

// ===========================================
// 2. LIVE ENROLLMENT NOTIFICATIONS 
// ===========================================

export function EnrollmentNotifications() {
  const { newEnrollments } = useRealtimeEnrollments(organizationId)
  
  return (
    <NotificationCenter>
      {newEnrollments.map(enrollment => (
        <Toast key={enrollment.id} type="success">
          🎉 {enrollment.studentName} enrolled in {enrollment.programName}
          <small>{enrollment.timestamp}</small>
        </Toast>
      ))}
    </NotificationCenter>
  )
}

// ===========================================
// 3. COLLABORATIVE PROGRAM EDITING
// ===========================================

export function ProgramEditor({ programId }) {
  const program = useRealtimeProgram(programId)
  const [editingUsers, setEditingUsers] = useState([])
  
  // Show who else is editing this program
  useEffect(() => {
    const channel = supabase
      .channel(`program-${programId}-presence`)
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState()
        setEditingUsers(Object.values(newState))
      })
      .subscribe()
      
    return () => supabase.removeChannel(channel)
  }, [programId])
  
  return (
    <div className="program-editor">
      {/* Show who's currently editing */}
      <PresenceIndicator>
        {editingUsers.map(user => (
          <Avatar key={user.userId} name={user.name} color={user.color} />
        ))}
      </PresenceIndicator>
      
      {/* Form updates in real-time as others type */}
      <ProgramForm program={program} />
    </div>
  )
}

// ===========================================
// 4. LIVE CUSTOM FIELD ANALYTICS
// ===========================================

export function CustomFieldAnalytics() {
  const fieldUsage = useRealtimeCustomFieldUsage(organizationId)
  
  return (
    <div className="analytics-panel">
      <h3>Custom Field Usage (Live)</h3>
      
      {/* Updates as admins use custom fields */}
      <Chart data={fieldUsage.trends} />
      
      <div className="popular-fields">
        <h4>Most Popular Custom Fields</h4>
        {fieldUsage.popular.map(field => (
          <div key={field.name} className="field-stat">
            <span>{field.name}</span>
            <Badge>{field.usageCount} uses</Badge>
            <small>Last used: {field.lastUsed}</small>
          </div>
        ))}
      </div>
    </div>
  )
}

// ===========================================
// 5. LIVE PROGRAM CAPACITY MONITORING
// ===========================================

export function ProgramCapacityMonitor() {
  const programs = useRealtimePrograms(organizationId)
  const [alerts, setAlerts] = useState([])
  
  // Monitor capacity in real-time
  useEffect(() => {
    const nearCapacity = programs.filter(p => {
      const enrolled = p.participants?.length || 0
      const maxStudents = p.custom_fields?.max_students || 999
      return enrolled / maxStudents > 0.8 // 80% capacity
    })
    
    setAlerts(nearCapacity)
  }, [programs])
  
  return (
    <div className="capacity-monitor">
      {alerts.map(program => (
        <Alert key={program.id} type="warning">
          ⚠️ {program.name} is at {Math.round(
            (program.participants.length / program.custom_fields.max_students) * 100
          )}% capacity
          <Button onClick={() => openNewSection(program.id)}>
            Open New Section
          </Button>
        </Alert>
      ))}
    </div>
  )
}

// ===========================================
// 6. LIVE STUDENT PROGRESS TRACKING
// ===========================================

export function StudentProgressTracker({ programId }) {
  const participants = useRealtimeParticipants(programId)
  const progressUpdates = useRealtimeProgressUpdates(programId)
  
  return (
    <div className="progress-tracker">
      <h3>Student Progress (Live Updates)</h3>
      
      {participants.map(participant => (
        <div key={participant.id} className="student-progress">
          <Avatar src={participant.student.avatar} />
          <div className="info">
            <span>{participant.student.name}</span>
            <ProgressBar 
              value={participant.progress_percentage} 
              className={`status-${participant.status}`}
            />
            
            {/* Show live status changes */}
            {progressUpdates
              .filter(update => update.studentId === participant.student_id)
              .map(update => (
                <RecentUpdate key={update.id}>
                  ✅ {update.activity} - {update.timestamp}
                </RecentUpdate>
              ))
            }
          </div>
        </div>
      ))}
    </div>
  )
}

// ===========================================
// 7. REAL-TIME CUSTOM FIELD SYNCHRONIZATION
// ===========================================

export function CustomFieldFormBuilder() {
  const formDefinition = useRealtimeFormDefinition(tableType, organizationId)
  const [livePreview, setLivePreview] = useState({})
  
  // When admin updates form definition, all users see changes instantly
  return (
    <div className="form-builder">
      <div className="builder-panel">
        <FormDesigner 
          definition={formDefinition}
          onChange={updateFormDefinition}
        />
      </div>
      
      <div className="preview-panel">
        <h4>Live Preview</h4>
        {/* Updates instantly as you design */}
        <DynamicForm 
          definition={formDefinition}
          data={livePreview}
          onChange={setLivePreview}
        />
      </div>
    </div>
  )
}