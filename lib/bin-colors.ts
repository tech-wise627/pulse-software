// Bin Status Color System for PULSE
export const BIN_STATUS_COLORS = {
  HEALTHY: '#00FF9C',      // Green - less than 50% full
  MEDIUM: '#FFC857',       // Yellow - 50-80% full
  FULL: '#FF3B5C',         // Red - over 80% full
  OFFLINE: '#5A5F66',      // Gray - device offline
} as const;

export const BIN_STATUS_LABELS = {
  HEALTHY: 'Healthy',
  MEDIUM: 'Medium',
  FULL: 'Full',
  OFFLINE: 'Offline',
} as const;

// Utility function to get bin status based on fill level and connectivity
export const getBinStatus = (fillLevel: number, isConnected: boolean) => {
  if (!isConnected) return { status: 'OFFLINE', color: BIN_STATUS_COLORS.OFFLINE, label: BIN_STATUS_LABELS.OFFLINE };
  if (fillLevel > 80) return { status: 'FULL', color: BIN_STATUS_COLORS.FULL, label: BIN_STATUS_LABELS.FULL };
  if (fillLevel >= 50) return { status: 'MEDIUM', color: BIN_STATUS_COLORS.MEDIUM, label: BIN_STATUS_LABELS.MEDIUM };
  return { status: 'HEALTHY', color: BIN_STATUS_COLORS.HEALTHY, label: BIN_STATUS_LABELS.HEALTHY };
};
