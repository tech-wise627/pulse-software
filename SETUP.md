# SmartBin Setup Guide

## Quick Start

### Step 1: Database Setup

Copy the SQL from `/scripts/01-create-schema.sql` and paste it into your **Supabase SQL Editor**:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor**
4. Click **New query**
5. Paste the entire content of `scripts/01-create-schema.sql`
6. Click **Run**
7. Repeat for `scripts/02-create-rls-policies.sql`

### Step 2: Create First Manager Account

1. Run the app: `pnpm dev`
2. Go to `http://localhost:3000/auth/signup`
3. Create an account with your email and password
4. In Supabase, go to **Table Editor** → **users**
5. Find your user record and set:
   - `role` = "manager"
   - `full_name` = Your name

### Step 3: Create Event Location

1. Login to the app
2. Click **+ New Location** button
3. Enter location details:
   - Name: "Event Name"
   - Address: Your address
   - City: Your city
4. Click on map to select location coordinates
5. Click **Create Location**

### Step 4: Install IoT Devices

1. On the manager dashboard, go to the **Devices** tab
2. Click **Install Device** button
3. Click on the map where you want to install a bin
4. Fill in device details:
   - Device ID: `BIN-001` (from your IoT hardware)
   - Bin Name: "Main Entrance" (location description)
5. Click **Install Device**
6. Repeat for each bin location

### Step 5: Create Staff Account

1. Sign up a new account for a staff member
2. In Supabase **users** table, set:
   - `role` = "staff"
   - `event_location_id` = UUID of your location
   - `full_name` = Staff member's name

### Step 6: Assign Bins to Staff

1. Go to **Assignments** (will add UI for this soon)
2. Or use the API:

```bash
curl -X POST http://localhost:3000/api/assignments \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "staff_id": "staff_user_uuid",
    "device_ids": ["device_uuid_1", "device_uuid_2", "device_uuid_3"]
  }'
```

### Step 7: Test Device Data

Send sensor data from your IoT device:

```bash
curl -X POST http://localhost:3000/api/devices/readings \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "BIN-001",
    "fill_level": 75,
    "battery_level": 85,
    "temperature": 22.5,
    "humidity": 45,
    "is_tilted": false,
    "is_connected": true
  }'
```

## User Workflows

### Manager Workflow

1. **Login** → Dashboard shows all bins and locations
2. **Monitor** → Watch real-time status and alerts
3. **Install** → Add new devices with map picker
4. **Assign** → Give bins to staff with route order
5. **Alert** → Receive notifications for issues

### Staff Workflow

1. **Login** → See assigned bins in order (1→2→3→4)
2. **Check** → View bin status (fill %, battery %)
3. **Navigate** → Get location and routing info
4. **Complete** → Mark bin as done when finished
5. **Track** → Monitor daily progress

## API Testing

### Get All Devices for a Location

```bash
curl "http://localhost:3000/api/devices?location_id=LOCATION_UUID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Unread Alerts

```bash
curl "http://localhost:3000/api/alerts?unread=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Mark Alert as Read

```bash
curl -X PATCH http://localhost:3000/api/alerts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "alert_id": "alert_uuid",
    "is_read": true
  }'
```

## Testing Alerts

To trigger different alert types:

### High Fill Alert (>80%)

```bash
curl -X POST http://localhost:3000/api/devices/readings \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "BIN-001",
    "fill_level": 85,
    "battery_level": 100
  }'
```

### Low Battery Alert (<20%)

```bash
curl -X POST http://localhost:3000/api/devices/readings \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "BIN-001",
    "fill_level": 50,
    "battery_level": 15
  }'
```

### Tilted Alert

```bash
curl -X POST http://localhost:3000/api/devices/readings \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "BIN-001",
    "fill_level": 50,
    "battery_level": 80,
    "is_tilted": true
  }'
```

### Disconnected Alert

Update device directly in Supabase:
- Go to **iot_devices** table
- Find your device
- Set `is_connected` = false
- Refresh dashboard

## Environment Variables

Create `.env.local` with:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
POSTGRES_URL=postgresql://postgres...
SUPABASE_JWT_SECRET=your-secret-key
```

Get these from Supabase:
1. Go to **Settings** → **API**
2. Copy the values and paste into `.env.local`

## Production Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy!

### Enable HTTPS

- Vercel provides free HTTPS
- PWA requires HTTPS to work
- Service Worker only works on secure connections

### Scale Database

- Supabase auto-scales PostgreSQL
- Add indexes for large datasets (already included)
- Use read replicas for high traffic

## Troubleshooting

### Can't Login?

- Check Supabase Auth is enabled
- Verify email/password are correct
- Check user exists in `auth.users` table

### No Devices Showing?

- Verify devices have valid latitude/longitude
- Check location_id matches your location
- Ensure map has initial center coordinates

### Alerts Not Appearing?

- Check device_readings table has data
- Verify alert creation logic in API
- Check RLS policies allow reading alerts

### PWA Not Installing?

- Requires HTTPS (use `https://localhost` with mkcert locally)
- Check manifest.json is valid
- Verify service worker is registered

## Next Steps

1. ✅ Database setup
2. ✅ Create manager account
3. ✅ Create location
4. ✅ Install devices
5. ✅ Create staff accounts
6. ✅ Assign bins
7. Test with real IoT device data
8. Monitor staff progress
9. Handle alerts and maintenance
10. Scale to multiple locations

## Support

For issues:
1. Check the main README.md
2. Review Supabase logs
3. Check browser console for errors
4. Review API response in Network tab

Good luck! 🚀
