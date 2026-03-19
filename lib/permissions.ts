import { UserRole } from './types';

export const permissions = {
  admin: {
    // System Overview & Monitoring
    canViewSystemOverview: true,
    canViewGlobalAlerts: true,
    canReceiveAlerts: true,
    
    // Staff Management
    canAddStaff: true,
    canEditStaffDetails: true,
    canRemoveStaff: true,
    canDeactivateStaff: true,
    canUploadStaffPhoto: true,
    canUploadStaffDocuments: true,
    canViewStaffAssignments: true,
    
    // Reports & Analytics
    canViewReports: true,
    canViewEventReports: true,
    canViewWasteHeatmaps: true,
    canViewWasteTrends: true,
    canExportPDF: true,
    canExportCSV: true,
    canExportExcel: true,
    
    // System Settings
    canAccessSystemSettings: true,
    canManageManagers: true,
    canViewSystemHealth: true,
  },
  manager: {
    // System Overview & Monitoring (limited to own location)
    canViewSystemOverview: false,
    canViewGlobalAlerts: false,
    canReceiveAlerts: true,
    
    // Staff Management (NOT ALLOWED - admin only)
    canAddStaff: false,
    canEditStaffDetails: false,
    canRemoveStaff: false,
    canDeactivateStaff: false,
    canUploadStaffPhoto: false,
    canUploadStaffDocuments: false,
    canViewStaffAssignments: true, // Can see which staff are assigned to bins
    
    // Reports & Analytics (NOT ALLOWED - admin only)
    canViewReports: false,
    canViewEventReports: false,
    canViewWasteHeatmaps: false,
    canViewWasteTrends: false,
    canExportPDF: false,
    canExportCSV: false,
    canExportExcel: false,
    
    // Event Operations
    canDeployBins: true,
    canMapBinLocation: true,
    canUpdateBinStatus: true,
    canAssignStaffToBins: true,
    canViewLiveEventMap: true,
    
    // System Settings (NOT ALLOWED)
    canAccessSystemSettings: false,
    canManageManagers: false,
    canViewSystemHealth: false,
  },
  staff: {
    // System Overview & Monitoring (NOT ALLOWED)
    canViewSystemOverview: false,
    canViewGlobalAlerts: false,
    canReceiveAlerts: true,
    
    // Staff Management (NOT ALLOWED)
    canAddStaff: false,
    canEditStaffDetails: false,
    canRemoveStaff: false,
    canDeactivateStaff: false,
    canUploadStaffPhoto: false,
    canUploadStaffDocuments: false,
    canViewStaffAssignments: false,
    
    // Reports & Analytics (NOT ALLOWED)
    canViewReports: false,
    canViewEventReports: false,
    canViewWasteHeatmaps: false,
    canViewWasteTrends: false,
    canExportPDF: false,
    canExportCSV: false,
    canExportExcel: false,
    
    // Worker Operations (ALLOWED)
    canViewAssignedBins: true,
    canSeeBinFillLevel: true,
    canFollowCleaningRoute: true,
    canMarkBinCleaned: true,
    canReportIssue: true,
    
    // System Settings (NOT ALLOWED)
    canAccessSystemSettings: false,
    canManageManagers: false,
    canViewSystemHealth: false,
  },
};

export function hasPermission(role: UserRole, permission: keyof typeof permissions.admin): boolean {
  return permissions[role][permission] ?? false;
}

export function canAccess(role: UserRole, requiredRole: UserRole | UserRole[]): boolean {
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(role);
  }
  
  const roleHierarchy: Record<UserRole, number> = {
    admin: 3,
    manager: 2,
    staff: 1,
  };
  
  return roleHierarchy[role] >= roleHierarchy[requiredRole];
}
