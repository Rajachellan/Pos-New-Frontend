"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import api from "@/src/app/services/api";

export interface UserAuthData {
  userId: string;
  name: string;
  email: string;
  username?: string;
  userRole?: string;
  systemRole: "SUPER_ADMIN" | "ORGANIZATION_USER";
  organizationRole?: "OWNER" | "ADMIN" | "MANAGER" | "STAFF" | null;
  organizationId?: string | null;
  organizationName?: string | null;
  branchId?: string | null;
  branchName?: string | null;
  isBranchLocked?: boolean;
  isAdmin?: boolean;
  isManager?: boolean;
  isStaff?: boolean;
  canViewFinances?: boolean;
  permissions?: string[];
}

interface AuthContextType {
  user: UserAuthData | null;
  token: string | null;
  loading: boolean;
  systemRole: "SUPER_ADMIN" | "ORGANIZATION_USER" | null;
  organizationRole: "OWNER" | "ADMIN" | "MANAGER" | "STAFF" | null;
  organizationId: string | null;
  organizationName: string | null;
  branchId: string | null;
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (perms: string[]) => boolean;
  hasAllPermissions: (perms: string[]) => boolean;
  isSuperAdmin: () => boolean;
  isOrganizationOwner: () => boolean;
  isAdmin: () => boolean;
  isManager: () => boolean;
  isStaff: () => boolean;
  canViewFinances: () => boolean;
  refreshAuthUser: () => Promise<void>;
  loginUser: (data: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserAuthData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const savedToken = localStorage.getItem("Token");
    const savedUserData = localStorage.getItem("UserData");

    if (savedToken) {
      setToken(savedToken);
      if (savedUserData) {
        try {
          setUser(JSON.parse(savedUserData));
        } catch (e) {
          console.error("Failed to parse cached user data", e);
        }
      }

      // Fetch fresh profile & permissions
      api.get("/user/get")
        .then((res) => {
          if (res.data?.success && res.data.data) {
            const d = res.data.data;
            const isAdminUser =
              d.systemRole === "SUPER_ADMIN" ||
              d.organizationRole === "OWNER" ||
              d.organizationRole === "ADMIN" ||
              d.userRole === "Admin";
            const isManagerUser = d.organizationRole === "MANAGER" || d.userRole === "Manager";
            const isStaffUser = !isAdminUser && !isManagerUser;
            const canViewFinancesVal = isAdminUser;
            const isStaffLocked = isStaffUser && !!(d.branch?._id || d.branch);
            const assignedBId = d.branch?._id || d.branch || null;
            if (isStaffLocked && assignedBId) {
              localStorage.setItem("pos_selected_branch", assignedBId);
            }

            const updatedUser: UserAuthData = {
              userId: d._id,
              name: d.name,
              email: d.email,
              username: d.username,
              systemRole: d.systemRole,
              organizationRole: d.organizationRole,
              organizationId: d.organization?._id || d.organization || null,
              organizationName: d.organization?.name || null,
              branchId: assignedBId,
              branchName: d.branch?.branchName || null,
              isBranchLocked: isStaffLocked,
              isAdmin: isAdminUser,
              isManager: isManagerUser,
              isStaff: isStaffUser,
              canViewFinances: canViewFinancesVal,
              permissions: d.permissions || [],
            };
            setUser(updatedUser);
            localStorage.setItem("UserData", JSON.stringify(updatedUser));
          }
        })
        .catch((err) => {
          // If token expired, clear
          if (err.response?.status === 401) {
            logout();
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const refreshAuthUser = async () => {
    try {
      const res = await api.get("/user/get");
      if (res.data?.success && res.data.data) {
        const d = res.data.data;
        const isAdminUser =
          d.systemRole === "SUPER_ADMIN" ||
          d.organizationRole === "OWNER" ||
          d.organizationRole === "ADMIN" ||
          d.userRole === "Admin" ||
          d.userRole === "Super-Admin";
        const isManagerUser = d.organizationRole === "MANAGER" || d.userRole === "Manager";
        const isStaffUser = !isAdminUser && !isManagerUser;
        const canViewFinancesVal = isAdminUser;
        const isStaffLocked = isStaffUser && !!(d.branch?._id || d.branch);
        const assignedBId = d.branch?._id || d.branch || null;

        const updatedUser: UserAuthData = {
          userId: d._id,
          name: d.name,
          email: d.email,
          username: d.username,
          systemRole: d.systemRole,
          organizationRole: d.organizationRole,
          organizationId: d.organization?._id || d.organization || null,
          organizationName: d.organization?.name || null,
          branchId: assignedBId,
          branchName: d.branch?.branchName || null,
          isBranchLocked: isStaffLocked,
          isAdmin: isAdminUser,
          isManager: isManagerUser,
          isStaff: isStaffUser,
          canViewFinances: canViewFinancesVal,
          permissions: d.permissions || [],
        };
        setUser(updatedUser);
        localStorage.setItem("UserData", JSON.stringify(updatedUser));
      }
    } catch (e) {
      console.error("Failed to refresh user profile", e);
    }
  };

  const loginUser = (data: any) => {
    localStorage.setItem("Token", data.token);

    const isAdminUser =
      data.systemRole === "SUPER_ADMIN" ||
      data.organizationRole === "OWNER" ||
      data.organizationRole === "ADMIN" ||
      data.userRole === "Admin" ||
      data.userRole === "Super-Admin";

    const isManagerUser = data.organizationRole === "MANAGER" || data.userRole === "Manager";
    const isStaffUser = !isAdminUser && !isManagerUser;
    const canViewFinancesVal = isAdminUser;
    const isStaffLocked = isStaffUser && !!data.branchId;

    // If staff user is bound to a branch, strictly lock pos_selected_branch
    if (isStaffLocked && data.branchId) {
      localStorage.setItem("pos_selected_branch", data.branchId);
    }

    const authData: UserAuthData = {
      userId: data.userId,
      name: data.userName,
      email: data.userEmail || "",
      systemRole: data.systemRole || (data.userRole === "Super-Admin" ? "SUPER_ADMIN" : "ORGANIZATION_USER"),
      organizationRole: data.organizationRole || (data.userRole === "Super-Admin" ? null : isManagerUser ? "MANAGER" : "STAFF"),
      organizationId: data.organizationId || null,
      organizationName: data.organizationName || null,
      branchId: data.branchId || null,
      branchName: data.branchName || null,
      isBranchLocked: isStaffLocked,
      isAdmin: isAdminUser,
      isManager: isManagerUser,
      isStaff: isStaffUser,
      canViewFinances: canViewFinancesVal,
      permissions: data.permissions || [],
    };
    setToken(data.token);
    setUser(authData);
    localStorage.setItem("UserData", JSON.stringify(authData));

    // Dynamic routing: Admin goes to Admin console, Manager and Staff go to POS user-dashboard
    if (authData.systemRole === "SUPER_ADMIN") {
      router.push("/super-admin/dashboard");
    } else if (authData.organizationRole === "OWNER" || authData.organizationRole === "ADMIN" || authData.isAdmin) {
      router.push("/admin-dashboard");
    } else {
      router.push("/user-dashboard");
    }
  };

  const logout = () => {
    localStorage.removeItem("Token");
    localStorage.removeItem("UserData");
    localStorage.removeItem("pos_selected_branch");
    setUser(null);
    setToken(null);
    router.push("/user/login");
  };

  const isSuperAdmin = () => user?.systemRole === "SUPER_ADMIN";
  const isOrganizationOwner = () => user?.organizationRole === "OWNER";
  const isAdmin = () => isSuperAdmin() || isOrganizationOwner() || user?.organizationRole === "ADMIN" || user?.userRole === "Admin" || !!user?.isAdmin;
  const isManager = () => user?.organizationRole === "MANAGER" || user?.userRole === "Manager" || !!user?.isManager;
  const isStaff = () => !isAdmin() && !isManager();
  // ONLY Admin (and SuperAdmin) can view financial data; Manager and Staff cannot!
  const canViewFinances = () => isAdmin();

  const hasPermission = (permission: string) => {
    if (!user) return false;
    if (user.systemRole === "SUPER_ADMIN") return true;
    if (user.organizationRole === "OWNER") return true;
    return (user.permissions || []).includes(permission);
  };

  const hasAnyPermission = (perms: string[]) => {
    if (!user) return false;
    if (user.systemRole === "SUPER_ADMIN" || user.organizationRole === "OWNER") return true;
    return perms.some((p) => (user.permissions || []).includes(p));
  };

  const hasAllPermissions = (perms: string[]) => {
    if (!user) return false;
    if (user.systemRole === "SUPER_ADMIN" || user.organizationRole === "OWNER") return true;
    return perms.every((p) => (user.permissions || []).includes(p));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        systemRole: user?.systemRole || null,
        organizationRole: user?.organizationRole || null,
        organizationId: user?.organizationId || null,
        organizationName: user?.organizationName || null,
        branchId: user?.branchId || null,
        permissions: user?.permissions || [],
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        isSuperAdmin,
        isOrganizationOwner,
        isAdmin,
        isManager,
        isStaff,
        canViewFinances,
        refreshAuthUser,
        loginUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
