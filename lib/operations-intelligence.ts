// ==================== OVERFLOW PREDICTION ====================

export interface BinFillHistory {
  timestamp: number;
  fillLevel: number;
}

export interface OverflowPrediction {
  binId: string;
  currentFill: number;
  fillRate: number; // percentage per minute
  minutesUntilOverflow: number;
  isAlertable: boolean; // true if overflow expected within 15 minutes
}

export const calculateFillRate = (
  previousFill: number,
  currentFill: number,
  timeMinutesDiff: number
): number => {
  if (timeMinutesDiff <= 0) return 0;
  return (currentFill - previousFill) / timeMinutesDiff;
};

export const predictOverflow = (
  binId: string,
  currentFill: number,
  fillRate: number
): OverflowPrediction => {
  const remainingCapacity = 100 - currentFill;
  const minutesUntilOverflow = fillRate > 0 ? remainingCapacity / fillRate : Infinity;

  return {
    binId,
    currentFill,
    fillRate,
    minutesUntilOverflow: Math.round(minutesUntilOverflow),
    isAlertable: minutesUntilOverflow <= 15 && minutesUntilOverflow > 0,
  };
};

// ==================== CROWD DENSITY ESTIMATION ====================

export interface CrowdDensityInfo {
  zoneId: string;
  zoneName: string;
  averageFillRate: number;
  binCount: number;
  density: 'low' | 'medium' | 'high';
  color: string;
}

export const estimateCrowdDensity = (
  zoneId: string,
  zoneName: string,
  binFillRates: number[]
): CrowdDensityInfo => {
  const averageFillRate = binFillRates.length > 0 
    ? binFillRates.reduce((a, b) => a + b, 0) / binFillRates.length 
    : 0;

  let density: 'low' | 'medium' | 'high' = 'low';
  let color = '#22C55E'; // green

  if (averageFillRate >= 2) {
    density = 'high';
    color = '#EF4444'; // red
  } else if (averageFillRate >= 1) {
    density = 'medium';
    color = '#FACC15'; // yellow
  }

  return {
    zoneId,
    zoneName,
    averageFillRate: parseFloat(averageFillRate.toFixed(2)),
    binCount: binFillRates.length,
    density,
    color,
  };
};

// ==================== BIN MAINTENANCE TRACKER ====================

export interface MaintenanceStatus {
  binId: string;
  deviceId: string;
  binName: string;
  issues: MaintenanceIssue[];
  requiresMaintenance: boolean;
  severity: 'low' | 'medium' | 'high';
}

export interface MaintenanceIssue {
  type: 'battery_low' | 'no_signal' | 'offline' | 'tilt_detected' | 'sensor_error';
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export const checkDeviceMaintenance = (device: any): MaintenanceStatus => {
  const issues: MaintenanceIssue[] = [];

  // Battery check
  if (device.battery_level < 20) {
    issues.push({
      type: 'battery_low',
      message: `Battery Low: ${device.battery_level}%`,
      severity: device.battery_level < 10 ? 'high' : 'medium',
    });
  }

  // Connectivity check
  if (!device.is_connected) {
    issues.push({
      type: 'offline',
      message: 'Device Offline',
      severity: 'high',
    });
  }

  // Signal strength check (if available)
  if (device.signal_strength && device.signal_strength < 2) {
    issues.push({
      type: 'no_signal',
      message: 'Weak Signal',
      severity: 'medium',
    });
  }

  // Tilt detection
  if (device.is_tilted) {
    issues.push({
      type: 'tilt_detected',
      message: 'Bin Tilted',
      severity: 'medium',
    });
  }

  // Last sync check
  if (device.last_sync) {
    const lastSyncTime = new Date(device.last_sync).getTime();
    const timeSinceSync = Date.now() - lastSyncTime;
    if (timeSinceSync > 300000) { // 5 minutes
      issues.push({
        type: 'sensor_error',
        message: 'No Recent Data',
        severity: 'medium',
      });
    }
  }

  const maxSeverity = issues.length > 0 
    ? (issues.some(i => i.severity === 'high') ? 'high' : 
       issues.some(i => i.severity === 'medium') ? 'medium' : 'low')
    : 'low';

  return {
    binId: device.id,
    deviceId: device.device_id,
    binName: device.name,
    issues,
    requiresMaintenance: issues.length > 0,
    severity: maxSeverity,
  };
};

// ==================== STAFF PANIC BUTTON ====================

export interface IssueReport {
  id: string;
  workerId: string;
  workerName: string;
  zone: string;
  binId: string;
  issueType: 'bin_damaged' | 'overflow_emergency' | 'crowd_problem' | 'safety_issue' | 'other';
  issueTypeLabel: string;
  description: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  status: 'reported' | 'acknowledged' | 'resolved';
  priority: 'low' | 'medium' | 'high';
}

export const createIssueReport = (
  workerId: string,
  workerName: string,
  zone: string,
  binId: string,
  issueType: IssueReport['issueType'],
  description: string,
  latitude: number,
  longitude: number
): IssueReport => {
  const issueTypeLabels: Record<IssueReport['issueType'], string> = {
    bin_damaged: 'Bin Damaged',
    overflow_emergency: 'Overflow Emergency',
    crowd_problem: 'Crowd Problem',
    safety_issue: 'Safety Issue',
    other: 'Other',
  };

  const priorityMap: Record<IssueReport['issueType'], 'low' | 'medium' | 'high'> = {
    bin_damaged: 'medium',
    overflow_emergency: 'high',
    crowd_problem: 'high',
    safety_issue: 'high',
    other: 'low',
  };

  return {
    id: `issue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    workerId,
    workerName,
    zone,
    binId,
    issueType,
    issueTypeLabel: issueTypeLabels[issueType],
    description,
    latitude,
    longitude,
    timestamp: Date.now(),
    status: 'reported',
    priority: priorityMap[issueType],
  };
};

// ==================== HELPER FUNCTIONS ====================

export const getMockDeviceFillHistory = (deviceId: string): BinFillHistory[] => {
  // Simulate 10-minute history with random variations
  const history: BinFillHistory[] = [];
  const now = Date.now();
  
  for (let i = 10; i >= 0; i--) {
    history.push({
      timestamp: now - i * 60000,
      fillLevel: 40 + Math.random() * 20 + i * 3,
    });
  }
  
  return history;
};

export const getMaintenanceSummary = (devices: any[]) => {
  const maintenanceStatuses = devices.map(checkDeviceMaintenance);
  
  return {
    totalDevices: devices.length,
    devicesOnline: devices.filter(d => d.is_connected).length,
    devicesOffline: devices.filter(d => !d.is_connected).length,
    lowBatteryDevices: devices.filter(d => d.battery_level < 20).length,
    requiresMaintenance: maintenanceStatuses.filter(m => m.requiresMaintenance).length,
    highPriorityIssues: maintenanceStatuses.filter(m => m.severity === 'high').length,
    maintenanceStatuses,
  };
};
