function serializeEvent(event) {
  const data = event.toJSON ? event.toJSON() : event;
  const tagItems = Array.isArray(data.tagItems) ? data.tagItems : [];
  const registeredUsers = Array.isArray(data.registeredUsers) ? data.registeredUsers : [];

  return {
    _id: data.id,
    title: data.title,
    description: data.description,
    type: data.type,
    department: data.department,
    faculty: data.faculty,
    date: data.date,
    endDate: data.endDate,
    time: data.time,
    venue: data.venue,
    speaker: data.speaker,
    capacity: data.capacity,
    registrations: data.registrations,
    views: data.views,
    clicks: data.clicks,
    bannerImage: data.bannerImage,
    attachments: data.attachments || [],
    tags: tagItems.filter((item) => item.kind === "tag").map((item) => item.value),
    subjectTags: tagItems.filter((item) => item.kind === "subject").map((item) => item.value),
    color: data.color,
    featured: data.featured,
    status: data.status,
    rejectionReason: data.rejectionReason,
    createdBy: data.createdBy
      ? { _id: data.createdBy.id, fullName: data.createdBy.fullName, email: data.createdBy.email, role: data.createdBy.role, department: data.createdBy.department }
      : undefined,
    registeredUsers: registeredUsers.map((user) => user.id),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

function serializeUser(user, options = {}) {
  const data = user.toJSON ? user.toJSON() : user;
  const preferenceItems = Array.isArray(data.preferenceItems) ? data.preferenceItems : [];
  const bookmarkedEvents = Array.isArray(data.bookmarkedEvents) ? data.bookmarkedEvents : [];

  return {
    _id: data.id,
    id: data.id,
    fullName: data.fullName,
    email: data.email,
    role: data.role,
    department: data.department,
    phone: data.phone,
    rollNumber: data.rollNumber,
    year: data.year,
    designation: data.designation,
    facultyId: data.facultyId,
    researchDomain: data.researchDomain,
    supervisor: data.supervisor,
    interests: preferenceItems.filter((item) => item.kind === "interest").map((item) => item.value),
    subscribedSubjects: preferenceItems.filter((item) => item.kind === "subject").map((item) => item.value),
    bookmarks: bookmarkedEvents.map((event) => event.id),
    notifications: data.notifications || [],
    avatar: data.avatar,
    isVerified: data.isVerified,
    createdAt: data.createdAt,
    ...(options.includePassword ? { password: data.password } : {}),
  };
}

module.exports = { serializeEvent, serializeUser };
