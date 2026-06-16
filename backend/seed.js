const { User, Event, sequelize, syncDatabase } = require("./db/models");
const { replaceEventTags, replaceUserPreferences } = require("./utils/dbCollections");
const { connectForScript } = require("./utils/scriptSafety");

const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD || "ChangeMe123!";

const users = [
  { fullName: "Demo Student", email: "student@example.edu", role: "student", department: "Computer Science & Engineering", rollNumber: "21CS1045", year: "3rd Year", phone: "+91 9876543210" },
  { fullName: "Demo Faculty", email: "faculty@example.edu", role: "faculty", department: "Computer Science & Engineering", designation: "Associate Professor", facultyId: "FAC-CS-2018-042" },
  { fullName: "Demo Scholar", email: "scholar@example.edu", role: "student", department: "Physics", year: "Ph.D 2nd Year", researchDomain: "Quantum Information Theory", supervisor: "Prof. Arun Kumar" },
  { fullName: "Demo Admin", email: "admin@example.edu", role: "admin", department: "Central Administration" },
];

const baseEvents = [
  { title: "Quantum Computing Conference", description: "A flagship academic conference on quantum computing.", type: "conference", department: "Physics", venue: "Main Auditorium", speaker: "Prof. Arun Kumar", capacity: 300, tags: ["quantum", "research"], subjectTags: ["Physics"] },
  { title: "Deep Learning Workshop", description: "Hands-on workshop on deep learning for students and faculty.", type: "workshop", department: "Computer Science & Engineering", venue: "Computer Center", speaker: "Demo Faculty", capacity: 120, tags: ["AI", "ML"], subjectTags: ["Computer Science"] },
  { title: "Scientific Writing Training", description: "Training program for research scholars on writing and publishing.", type: "training", department: "Central Library", venue: "Library Hall", speaker: "Chief Librarian", capacity: 80, tags: ["research", "writing"], subjectTags: ["Research"] },
  { title: "AI in Healthcare Lecture", description: "Guest lecture on AI applications in healthcare.", type: "lecture", department: "Medicine", venue: "Medical Wing", speaker: "Guest Speaker", capacity: 150, tags: ["AI", "healthcare"], subjectTags: ["Medicine"] },
];

async function seedDB() {
  await connectForScript("seed");
  await syncDatabase({ force: true });

  const createdUsers = [];
  for (const user of users) {
    const created = await User.create({ ...user, password: DEMO_PASSWORD, isVerified: true });
    createdUsers.push(created);
  }

  await replaceUserPreferences(createdUsers[0].id, { interests: ["AI", "Computer Science"], subscribedSubjects: ["Physics"] }, null, { interests: [], subscribedSubjects: [] });

  for (let index = 0; index < baseEvents.length; index += 1) {
    const template = baseEvents[index];
    const date = new Date();
    date.setDate(date.getDate() + index * 3 + 2);
    const creator = createdUsers[index % createdUsers.length];

    const event = await Event.create({
      title: template.title,
      description: template.description,
      type: template.type,
      department: template.department,
      faculty: template.department,
      date,
      time: "10:00 AM - 01:00 PM",
      venue: template.venue,
      speaker: template.speaker,
      capacity: template.capacity,
      registrations: 0,
      color: ["#6366f1", "#10b981", "#f59e0b", "#8b5cf6"][index],
      featured: index < 2,
      status: creator.role === "student" ? "pending" : "approved",
      createdById: creator.id,
    });

    await replaceEventTags(event.id, { tags: template.tags, subjectTags: template.subjectTags }, null, { tags: [], subjectTags: [] });
  }

  console.log("✅ Database seeded successfully");
  console.log(`Student: student@example.edu / ${DEMO_PASSWORD}`);
  console.log(`Faculty: faculty@example.edu / ${DEMO_PASSWORD}`);
  console.log(`Scholar: scholar@example.edu / ${DEMO_PASSWORD}`);
  console.log(`Admin: admin@example.edu / ${DEMO_PASSWORD}`);
}

seedDB()
  .then(() => sequelize.close())
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Seed Error:", error);
    process.exit(1);
  });
