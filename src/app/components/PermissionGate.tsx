"use client";

import React from "react";
import { useAuth } from "@/src/app/context/AuthContext";

interface PermissionGateProps {
  permission?: string;
  permissions?: string[];
  mode?: "any" | "all";
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  permissions,
  mode = "any",
  fallback = null,
  children,
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isSuperAdmin, isOrganizationOwner } = useAuth();

  // Super Admin or Organization Owner has full access to UI elements
  if (isSuperAdmin() || isOrganizationOwner()) {
    return <>{children}</>;
  }

  let allowed = false;

  if (permission) {
    allowed = hasPermission(permission);
  } else if (permissions && permissions.length > 0) {
    allowed = mode === "all" ? hasAllPermissions(permissions) : hasAnyPermission(permissions);
  } else {
    allowed = true;
  }

  if (!allowed) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};

export default PermissionGate;
