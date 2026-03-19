// Analytics utility functions for waste predictions and data aggregations

export interface WasteMetrics {
  totalBinsDeployed: number;
  recommendedBins: number;
  totalStaffDeployed: number;
  recommendedStaff: number;
  totalCleaningCycles: number;
  collectionEfficiency: number;
}

export interface HourlyWasteData {
  time: string;
  waste: number;
  bins: number;
}

export interface StaffPerformanceData {
  name: string;
  binsCleaned: number;
  responseTime: number;
  efficiency: number;
}

// Calculate waste metrics from device data
export function calculateWasteMetrics(devices: any[], assignments: any[]): WasteMetrics {
  const avgFillLevel = devices.length > 0 
    ? devices.reduce((sum, d) => sum + (d.fill_level || 0), 0) / devices.length 
    : 0;
  
  const fullyUtilized = devices.filter(d => (d.fill_level || 0) > 70).length;
  const recommendedBins = Math.ceil(devices.length * (avgFillLevel / 70));
  const recommendedStaff = Math.max(2, Math.ceil(devices.length / 15));
  
  return {
    totalBinsDeployed: devices.length,
    recommendedBins: Math.max(devices.length, recommendedBins),
    totalStaffDeployed: assignments.length,
    recommendedStaff,
    totalCleaningCycles: assignments.filter(a => a.completed_at).length,
    collectionEfficiency: assignments.length > 0 
      ? Math.round((assignments.filter(a => a.completed_at).length / assignments.length) * 100)
      : 0,
  };
}

// Generate hourly waste data (simulated)
export function generateHourlyWasteData(): HourlyWasteData[] {
  return [
    { time: '5pm', waste: 22, bins: 8 },
    { time: '6pm', waste: 41, bins: 14 },
    { time: '7pm', waste: 67, bins: 22 },
    { time: '8pm', waste: 82, bins: 28 },
    { time: '9pm', waste: 78, bins: 26 },
  ];
}

// Generate staff performance data
export function generateStaffPerformance(): StaffPerformanceData[] {
  return [
    { name: 'Rahul', binsCleaned: 18, responseTime: 4.2, efficiency: 92 },
    { name: 'Amit', binsCleaned: 14, responseTime: 6.1, efficiency: 88 },
    { name: 'Suresh', binsCleaned: 20, responseTime: 3.8, efficiency: 95 },
    { name: 'Priya', binsCleaned: 16, responseTime: 5.3, efficiency: 90 },
  ];
}

// Waste prediction based on historical trends
export function predictWasteTrend(currentFillLevel: number): {
  predictedNextHour: number;
  peakHour: string;
  recommendedAction: string;
} {
  const growthRate = 1.15; // 15% growth per hour
  const predictedNextHour = Math.min(Math.round(currentFillLevel * growthRate), 100);
  
  return {
    predictedNextHour,
    peakHour: '8-9 PM',
    recommendedAction: predictedNextHour > 90 ? 'Deploy additional bins' : 'Monitor closely',
  };
}

// Get zone waste intensity
export function getZoneWasteIntensity(): Array<{
  zone: string;
  level: 'High' | 'Medium' | 'Low';
  percentage: number;
  color: string;
}> {
  return [
    { zone: 'Food Court', level: 'High', percentage: 87, color: '#FF3B5C' },
    { zone: 'Stage Area', level: 'Medium', percentage: 63, color: '#FFC857' },
    { zone: 'Entrance', level: 'Low', percentage: 28, color: '#00FF9C' },
  ];
}

// Filter events based on criteria
export function filterEvents(
  events: any[],
  filters: {
    eventName?: string;
    location?: string;
    dateRange?: [string, string];
    timeFilter?: string;
  }
): any[] {
  return events.filter(event => {
    if (filters.eventName && !event.name.toLowerCase().includes(filters.eventName.toLowerCase())) {
      return false;
    }
    if (filters.location && !event.city?.toLowerCase().includes(filters.location.toLowerCase())) {
      return false;
    }
    if (filters.dateRange) {
      const eventDate = new Date(event.event_date);
      const [start, end] = filters.dateRange.map(d => new Date(d));
      if (eventDate < start || eventDate > end) {
        return false;
      }
    }
    return true;
  });
}

// Generate comparison data for multiple events
export function generateEventComparison(events: any[]): {
  event: string;
  efficiency: number;
  binsCleaned: number;
  staffUtilization: number;
}[] {
  return events.slice(0, 3).map((event, idx) => ({
    event: event.name || `Event ${idx + 1}`,
    efficiency: 85 + Math.random() * 15,
    binsCleaned: 30 + Math.random() * 20,
    staffUtilization: 75 + Math.random() * 20,
  }));
}
