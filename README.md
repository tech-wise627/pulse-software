# PULSE - Real-time IoT Waste Collection Management (Demo)

PULSE powered by Fostride is a complete IoT waste collection management system with real-time monitoring, worker assignments, and predictive insights. This demo includes full UI/UX for manager and staff dashboards.

## Features

### Manager Dashboard
- **Live Operations**: Real-time map with color-coded bins (Green: Healthy, Yellow: Medium, Red: Full, Gray: Offline)
- **Device Management**: Install new bins, assign zones, track device health and battery status
- **Worker Assignment**: Assign multiple bins to workers, auto-balance workload, drag-and-drop assignments
- **Alert System**: Real-time alerts for high fill (>80%), device offline, low battery, tampering
- **Route Optimization**: Auto-generated cleaning routes with priority reordering
- **Analytics**: Waste generation metrics, zone statistics, worker efficiency, cleaning activity timeline
- **Zone Management**: Create zones (Entrance, Food Court, Stage, VIP, etc.), group bins by zone
- **Communication**: Send instructions and priority updates to workers in real-time

### Staff Dashboard
- **Daily Route**: Optimized bin collection route with sequential stops
- **Progress Tracking**: Real-time percentage completion for the day
- **Stop Details**: Fill level, battery, location coordinates, zone info
- **Task Management**: Mark bins as completed, move through route sequentially

## 📁 Project Structure

```
app/
├── page.tsx                    # Home - redirects to dashboard selector
├── dashboard/
│   ├── page.tsx               # Dashboard selector/role choice page
│   ├── manager/
│   │   └── page.tsx           # Manager dashboard (full UI)
│   └── staff/
│       └── page.tsx           # Staff dashboard (full UI)
├── api/
│   └── locations/             # API routes (for future backend integration)

components/
├── DashboardNav.tsx           # Navigation bar (role switcher)
├── CreateLocationForm.tsx     # Location creation form with map picker
├── MapPicker.tsx              # Interactive map with GPS support
├── BinMap.tsx                 # Device location display map
└── (other UI components)

lib/
├── mock-data.ts              # All mock data (locations, devices, alerts, staff)
├── types.ts                  # TypeScript interfaces
└── geocoding.ts              # Location geocoding utilities
```

## 🚀 Getting Started

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Access the App

1. Open [http://localhost:3000](http://localhost:3000)
2. You'll see the dashboard selector page
3. Click **Manager Dashboard** or **Staff Dashboard** to explore

### Demo Data

**Locations:**
- Central Business District (Mumbai) - 3 devices
- Retail Park Mall (Bangalore) - 2 devices  
- Tech Park Campus (Hyderabad) - Ready for devices

**Devices:**
- Various fill levels (low, medium, high)
- Different battery statuses (normal, low, critical)
- Mixed online/offline connectivity states
- Some tilted/problematic bins for alerting

**Staff:**
- 2 staff members with pre-assigned routes
- Assignment tracking with completion status
- Route optimization data

**Alerts:**
- Critical: High fill, low battery, tilted bins
- Warning: Battery below 20%, connectivity issues
- Mix of read and unread alerts

## 🎨 UI Components Used

- **shadcn/ui**: Pre-built accessible components
  - Button, Card, Dialog, Tabs, Badge, Select, Progress, Alert
  - Input, Label, DropdownMenu
- **Lucide Icons**: 100+ icon library
- **Tailwind CSS**: Utility-first styling
- **Leaflet.js**: Interactive maps
- **React**: Component framework

## 🗺️ Map Features

- **Interactive markers** for device locations
- **Zoom and pan** controls
- **GPS integration** for current location detection
- **Custom icons** for device status
- **Popup information** for each bin

## 📊 Dashboard Views

### Manager View
1. **Statistics Cards** - Quick overview of system health
2. **Critical Alerts Banner** - Important issues requiring attention
3. **Map View Tab** - Visual representation of all bins
4. **Devices Tab** - Detailed device list with metrics
5. **Alerts Tab** - All alerts filtered by severity
6. **Staff Tab** - Team members and their assignments

### Staff View
1. **Progress Card** - Today's completion percentage
2. **Current Stop** - Focused details for the current bin
3. **Route List** - All remaining/completed stops
4. **Stop Details** - Fill level, battery, location coordinates
5. **Route Navigation** - Order-based bin assignments

## 🔄 Navigation

- **Dashboard Selector** - Choose role at `/dashboard`
- **Manager Dashboard** - Monitor all operations at `/dashboard/manager`
- **Staff Dashboard** - Track collection route at `/dashboard/staff`
- **Role Switching** - Toggle between views using navigation buttons

## 📝 Mock Data Management

All mock data is centralized in `lib/mock-data.ts`:
- Easily modify locations, devices, alerts
- Add or remove staff assignments
- Adjust device statuses for testing different scenarios
- Scale up number of devices/locations

## 🔮 Future Integration Points

When ready to add authentication and real backend:

1. **Replace mock data** with Supabase queries
2. **Add auth guards** using role-based middleware
3. **Connect API routes** to database operations
4. **Implement real-time** updates with Supabase subscriptions
5. **Add GPS tracking** for live staff location
6. **Enable notifications** for alerts

## 🎯 Testing Scenarios

### Manager Dashboard
- View all locations and switch between them
- Check alert details and severity levels
- Review device status and battery levels
- Track staff assignments and progress
- Explore map interactions and device clustering

### Staff Dashboard
- Start collection route with first bin
- Mark bins as completed and progress through route
- View detailed bin information
- Check fill levels and battery status
- See location coordinates for GPS navigation

## 📞 Support

This is a demo UI without backend integration. For production use:
- Connect to Supabase database
- Implement authentication
- Set up real-time device telemetry
- Configure push notifications
- Enable GPS tracking

---

**Note**: All data is mock and resets on page reload. No data persistence or authentication in this demo version.
