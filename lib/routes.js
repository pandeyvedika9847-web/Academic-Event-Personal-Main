const ROLE_HOME_PATHS = Object.freeze({
  student: "/student",
  faculty: "/faculty",
  admin: "/admin",
});

export function getRoleHomePath(role) {
  return ROLE_HOME_PATHS[role] || "/";
}

export function isKnownRole(role) {
  return Boolean(ROLE_HOME_PATHS[role]);
}
