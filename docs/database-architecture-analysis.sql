-- Recommended Hybrid Architecture for Real-time Reporting
-- PostgreSQL (OLTP) + ClickHouse/TimescaleDB (OLAP)

/*
ARCHITECTURE OVERVIEW:

┌─────────────────┐    Real-time     ┌──────────────────┐
│   PostgreSQL    │    Sync/CDC      │   ClickHouse     │
│   (Live Data)   │ ────────────────→│   (Analytics)    │
│                 │                  │                  │
│ • User signup   │                  │ • Aggregations   │
│ • CRUD ops      │                  │ • Time series    │
│ • Transactions │                  │ • Reports        │
│ • RLS policies  │                  │ • Dashboards     │
└─────────────────┘                  └──────────────────┘
         │                                      │
         ▼                                      ▼
   App Operations                        Report Queries
   (Fast & secure)                       (Ultra fast)

BENEFITS:
1. 🚀 10-100x faster analytical queries
2. 📊 Real-time dashboards without impacting app performance  
3. 🔄 Automatic data sync (CDC - Change Data Capture)
4. 📈 Optimized for time-series and aggregation queries
5. 🛡️ Keep RLS security for operational data
6. 📱 Separate scaling for app vs analytics
*/

-- IMPLEMENTATION APPROACH:

-- 1. Keep existing PostgreSQL for operational data
--    (Users, organizations, programs, participants, etc.)

-- 2. Add ClickHouse for analytics with materialized views:

-- Example ClickHouse schema for analytics:
CREATE TABLE analytics.enrollment_events (
    event_time DateTime64(3),
    organization_id UUID,
    program_id UUID,
    student_id UUID,
    event_type Enum('enrolled', 'completed', 'dropped'),
    enrollment_date Date,
    program_name String,
    student_age UInt8,
    created_at DateTime64(3)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_time)
ORDER BY (organization_id, event_time);

-- Real-time materialized view for dashboards:
CREATE MATERIALIZED VIEW analytics.enrollment_stats_hourly
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(hour)
ORDER BY (organization_id, program_id, hour)
AS SELECT
    organization_id,
    program_id,
    toStartOfHour(event_time) as hour,
    countIf(event_type = 'enrolled') as enrollments,
    countIf(event_type = 'completed') as completions,
    countIf(event_type = 'dropped') as dropouts
FROM analytics.enrollment_events
GROUP BY organization_id, program_id, hour;

-- 3. Data sync strategies:

-- Option A: Real-time CDC with Debezium
-- PostgreSQL → Kafka → ClickHouse

-- Option B: Scheduled ETL (simpler to start)
-- Run every 5 minutes via cron job

-- Option C: Application-level streaming
-- Write to both databases from your app

-- 4. Query patterns:

-- Fast operational queries (PostgreSQL):
SELECT * FROM programs WHERE organization_id = $1 AND status = 'active';

-- Fast analytical queries (ClickHouse):
SELECT 
    program_name,
    count() as total_enrollments,
    avg(student_age) as avg_age
FROM analytics.enrollment_events 
WHERE organization_id = $1 
  AND event_time >= now() - INTERVAL 30 DAY
GROUP BY program_name
ORDER BY total_enrollments DESC;

-- ALTERNATIVE: TimescaleDB (if you prefer staying in PostgreSQL ecosystem)
-- TimescaleDB is PostgreSQL + time-series optimizations

-- Create hypertables for time-series data:
CREATE TABLE enrollment_metrics (
    time TIMESTAMPTZ NOT NULL,
    organization_id UUID NOT NULL,
    program_id UUID,
    metric_name TEXT,
    metric_value NUMERIC
);

-- Convert to hypertable (partitioned by time)
SELECT create_hypertable('enrollment_metrics', 'time');

-- Fast time-series queries:
SELECT time_bucket('1 day', time) AS day,
       avg(metric_value) as avg_enrollments
FROM enrollment_metrics 
WHERE organization_id = $1 
  AND metric_name = 'daily_enrollments'
  AND time > NOW() - INTERVAL '30 days'
GROUP BY day ORDER BY day;

-- PERFORMANCE COMPARISON:

-- Current (PostgreSQL only):
-- ❌ Complex aggregation: 2-10 seconds
-- ❌ RLS overhead on every query
-- ❌ OLTP/OLAP resource contention

-- Hybrid (PostgreSQL + ClickHouse):
-- ✅ Same aggregation: 50-200ms  
-- ✅ No RLS overhead on analytics
-- ✅ Independent scaling

-- MIGRATION STRATEGY:

-- Phase 1: Keep current PostgreSQL setup
-- Phase 2: Add ClickHouse/TimescaleDB for new reporting
-- Phase 3: Migrate heavy analytical queries
-- Phase 4: Optimize based on usage patterns

-- START WITH: TimescaleDB extension on existing PostgreSQL
-- (Easier migration path, stays in PostgreSQL ecosystem)

-- IMPLEMENTATION STEPS:
-- 1. Add TimescaleDB extension to existing Supabase
-- 2. Create hypertables for time-series data
-- 3. Set up automated data aggregation functions
-- 4. Build reporting queries on hypertables
-- 5. Monitor performance improvements

/*
RECOMMENDATION FOR YOUR USE CASE:

Start with TimescaleDB because:
1. ✅ Easier to implement (PostgreSQL extension)
2. ✅ Works with existing Supabase setup
3. ✅ Familiar SQL syntax
4. ✅ Great for time-series reporting
5. ✅ Can later migrate to ClickHouse if needed

For reporting queries like:
- Enrollment trends over time
- Program performance metrics  
- User activity patterns
- Revenue/participation analytics

TimescaleDB will give you 5-50x performance improvement
without the complexity of managing multiple databases.
*/