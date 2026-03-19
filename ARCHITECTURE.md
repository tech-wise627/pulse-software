# SmartBin Architecture

## System Overview

SmartBin is a real-time IoT waste management system built on Next.js 16 with Supabase. It enables managers to monitor waste collection bins and coordinate staff efficiently.

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser / Mobile                         │
├─────────────────────────────────────────────────────────────┤
│ Manager Dashboard | Staff Dashboard | Authentication Pages  │
│    (React/PWA)    |  (Mobile PWA)   |   (Next.js Pages)    │
└────────────┬────────────────────────────────────────────────┘
             │
             │ HTTPS/REST API
             ▼
┌─────────────────────────────────────────────────────────────┐
│              Next.js 16 API Routes (Edge)                   │
├─────────────────────────────────────────────────────────────┤
│  /api/devices        /api/alerts      /api/assignments      │
│  /api/locations      /api/setup       /api/devices/readings │
└────────────┬────────────────────────────────────────────────┘
             │
             │ PostgreSQL / RLS
             ▼
┌─────────────────────────────────────────────────────────────┐
│                  Supabase Backend                            │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL DB | Auth | Real-time | Storage | Edge Functions│
└────────────┬────────────────────────────────────────────────┘
             │
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│              IoT Devices (Field)                             │
├─────────────────────────────────────────────────────────────┤
│  Waste Bins with Sensors (GPS, Fill Level, Battery, Tilt)  │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Device Data Ingestion

```
IoT Device → POST /api/devices/readings
                    ↓
                [Validate & Store]
                    ↓
            device_readings table
                    ↓
          [Check for Alerts]
                    ↓
           Create alerts table
                    ↓
        [Real-time subscription]
                    ↓
     Manager Dashboard updates
     Staff Devices notified
```

### 2. Manager assigns bins to staff

```
Manager Dashboard → Assignment UI
                       ↓
            POST /api/assignments
                       ↓
         staff_assignments table
                       ↓
        [Real-time subscription]
                       ↓
         Staff app refreshes
      Shows assigned bins
```

### 3. Staff completes task

```
Staff App → PATCH /api/assignments
                   ↓
           Mark completed_at
                   ↓
     Update staff_assignments
                   ↓
     [Notification sent]
                   ↓
    Manager sees progress
```

## Database Schema

### Core Tables

```
users
├── id (UUID, FK auth.users)
├── email
├── full_name
├── role (manager | staff)
├── event_location_id (FK)
└── timestamps

event_locations
├── id (UUID)
├── name
├── latitude, longitude
├── manager_id (FK users)
└── timestamps

iot_devices
├── id (UUID)
├── device_id (unique, from hardware)
├── name
├── location_id (FK)
├── latitude, longitude
├── battery_level
├── is_connected
├── is_tilted
└── timestamps

device_readings
├── id (UUID)
├── device_id (FK)
├── fill_level (0-100%)
├── battery_level
├── is_tilted
├── is_connected
├── reading_timestamp
└── created_at

staff_assignments
├── id (UUID)
├── staff_id (FK users)
├── device_id (FK iot_devices)
├── assigned_by (FK users)
├── assignment_order (1,2,3...)
├── completed_at (NULL until done)
└── timestamps

alerts
├── id (UUID)
├── location_id (FK)
├── device_id (FK)
├── alert_type (high_fill|low_battery|disconnected|tilted)
├── severity (critical|warning|info)
├── message
├── is_read
├── resolved_at
└── timestamps

cleaning_logs
├── id (UUID)
├── device_id (FK)
├── staff_id (FK)
├── fill_level_before, fill_level_after
└── timestamps
```

## Authentication & Authorization

### Supabase Auth Flow

```
User Signup/Login
       ↓
  Email + Password
       ↓
  Supabase Auth
       ↓
   JWT Token
       ↓
 Store in httpOnly cookie
       ↓
   Include in requests
       ↓
   Verified at DB level
```

### Row-Level Security (RLS)

Each table has policies:

```
Users Table
├── SELECT: Can view own profile + users in same location
├── UPDATE: Managers can update their location's users

IoT Devices
├── SELECT: Users can view devices in their location
├── INSERT/UPDATE: Managers only

Device Readings
├── SELECT: Users with device access
├── INSERT: Service role only (from IoT devices)

Alerts
├── SELECT: Managers see all, staff see assigned devices
├── UPDATE: Managers can mark as read/resolved

Staff Assignments
├── SELECT: Managers see all, staff see own assignments
├── INSERT/UPDATE: Managers only
```

## Real-time Updates

### Supabase Real-time Subscriptions

```
┌─────────────────────────────────┐
│   Database Table Changes        │
│  (INSERT/UPDATE on alerts)      │
└────────────┬────────────────────┘
             │
             ▼
    ┌────────────────────┐
    │ Broadcast Changes  │
    └────────┬───────────┘
             │
      ┌──────┴──────┬──────────┐
      ▼             ▼          ▼
 Browser 1    Browser 2    Browser 3
 (Manager)    (Manager)    (Staff)
```

## Component Architecture

### Hierarchy

```
RootLayout
├── PWAInit (Service Worker registration)
├── ThemeProvider
│   └── {children}
│       ├── page.tsx (Auth redirect)
│       ├── auth/
│       │   ├── login/
│       │   └── signup/
│       └── dashboard/
│           ├── manager/
│           │   ├── DashboardNav
│           │   ├── RealtimeAlertBanner
│           │   ├── BinMap
│           │   ├── AlertsList
│           │   └── DevicesList
│           └── staff/
│               ├── DashboardNav
│               ├── ProgressCard
│               ├── AssignmentsList
│               └── DeviceDetailDialog
```

### Data Flow with SWR

```
Component Mount
       ↓
useSWR Hook (e.g., useDevices)
       ↓
Fetch from /api/devices
       ↓
Cache locally
       ↓
Revalidate on focus
       ↓
Subscribe to real-time changes
       ↓
Mutate cache when data updates
```

## API Endpoints

### RESTful Design

```
Devices
├── GET /api/devices              [list all]
└── POST /api/devices             [create]

Devices - Readings
├── GET /api/devices/readings     [list]
└── POST /api/devices/readings    [create from IoT]

Assignments
├── GET /api/assignments          [list]
├── POST /api/assignments         [create batch]
└── PATCH /api/assignments/:id    [mark complete]

Alerts
├── GET /api/alerts               [list]
└── PATCH /api/alerts/:id         [mark read/resolved]

Locations
├── GET /api/locations            [list]
└── POST /api/locations           [create]

Setup
└── POST /api/setup/init-db       [initialize schema]
```

## Key Features Explained

### 1. Device Installation Wizard

```
Step 1: Select Location on Map
  └─ Click → Get coordinates

Step 2: Enter Device Details
  ├─ Device ID: from hardware
  ├─ Bin Name: user-friendly
  └─ Auto-populated coordinates

Step 3: Save
  └─ POST /api/devices
     └─ Store with lat/lon
```

### 2. Alert System

```
Device sends readings
       ↓
Check business logic:
├─ fill_level > 80% → HIGH_FILL alert
├─ battery_level < 20% → LOW_BATTERY alert
├─ is_tilted = true → TILTED alert
└─ is_connected = false → DISCONNECTED alert
       ↓
If first time:
└─ Insert into alerts table
       ↓
Real-time broadcast
       ↓
Dashboard receives:
├─ Visual banner
├─ Audio beep
└─ Notification
```

### 3. Staff Route Optimization

```
Simple Sequential Ordering:

Manager assigns:
  - BIN-001 (order: 1)
  - BIN-002 (order: 2)
  - BIN-003 (order: 3)

Staff sees:
  1️⃣ Main Entrance (BIN-001)
  2️⃣ Side Alley (BIN-002)
  3️⃣ Back Area (BIN-003)

Staff navigates in order (1→2→3)
```

### 4. PWA Features

```
Service Worker
├─ Cache key assets
├─ Handle offline
├─ Background sync
└─ Push notifications

Manifest
├─ App name & icon
├─ Display mode: standalone
├─ Theme color
└─ Start URL

Offline Capability
├─ Cache GET requests
├─ Queue POST requests
└─ Sync when online
```

## Scalability Considerations

### Current Design

✅ Works for:
- Single event with multiple bins (100s of devices)
- Multiple staff members (10-50 people)
- Real-time updates to all dashboards

### For Scaling

Consider:
- Add read replicas for high query volumes
- Implement materialized views for analytics
- Use Supabase Vector for spatial queries
- Add caching layer (Redis) for frequently accessed data
- Implement pagination for large lists
- Archive old device_readings to separate table

## Security Measures

1. **Authentication**
   - Supabase Auth handles secure login
   - JWT tokens validate requests

2. **Authorization**
   - RLS policies at database level
   - API routes check user roles
   - Managers can't see other manager's locations

3. **Data Protection**
   - HTTPS only (enforced in production)
   - No sensitive data in localStorage
   - httpOnly cookies for tokens
   - Service role key never exposed to client

4. **Input Validation**
   - API routes validate all inputs
   - Supabase types provide type safety
   - Coordinates validated as valid lat/lon

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database schema created
- [ ] RLS policies enabled
- [ ] Supabase Auth enabled
- [ ] First manager account created
- [ ] Test location created
- [ ] Test devices installed
- [ ] Test staff account created
- [ ] Test assignment created
- [ ] Test device readings submitted
- [ ] Alerts working
- [ ] Real-time updates working
- [ ] PWA installable
- [ ] Mobile responsive layout working
- [ ] HTTPS enabled (production)

## Monitoring & Maintenance

### Recommended Monitoring

- Supabase Dashboard for database health
- Vercel Analytics for page performance
- Error tracking for API failures
- Real-time subscription status

### Regular Tasks

- Archive old device_readings monthly
- Review and clean up unused locations
- Update device firmware via API
- Monitor staff assignment efficiency

## Future Enhancements

1. **Advanced Route Optimization**
   - Use OSRM or Google Routes API
   - Calculate optimal visiting order
   - Predict collection time

2. **Predictive Alerts**
   - ML models to predict when bins will fill
   - Recommend collection schedule

3. **Mobile App**
   - Native iOS/Android apps
   - Better offline support
   - Push notifications

4. **Analytics Dashboard**
   - Collection efficiency metrics
   - Staff performance tracking
   - Waste volume trends

5. **Integration**
   - City waste management systems
   - Truck routing
   - Payment/billing systems

---

For more details, see README.md and SETUP.md
