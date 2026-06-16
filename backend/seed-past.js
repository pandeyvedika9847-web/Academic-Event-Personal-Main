const { User, Event, sequelize } = require("./db/models");
const { replaceEventTags } = require("./utils/dbCollections");
const { connectForScript } = require("./utils/scriptSafety");

const pastEvents = [
  { title: "Quantum Foundations Lecture", type: "lecture", department: "Computer Science", color: "#6366f1" },
  { title: "Modern Web Workshop", type: "workshop", department: "Information Technology", color: "#10b981" },
  { title: "Science Conference", type: "conference", department: "Science", color: "#8b5cf6" },
  { title: "AI in Healthcare Seminar", type: "seminar", department: "Medicine", color: "#f59e0b" },
];

async function run() {
  await connectForScript("seed-past");
  const creator = await User.findOne({ where: { role: "admin" } });
  if (!creator) throw new Error("No admin user found. Run the base seed first.");

  for (let index = 0; index < pastEvents.length; index += 1) {
    const template = pastEvents[index];
    const date = new Date();
    date.setDate(date.getDate() - (index + 2) * 3);
    const event = await Event.create({
      title: template.title,
      description: `${template.title} description.`,
      type: template.type,
      department: template.department,
      faculty: template.department,
      date,
      time: "11:00 AM - 01:00 PM",
      venue: `${template.department} Hall`,
      speaker: "Guest Speaker",
      capacity: 100,
      status: "approved",
      createdById: creator.id,
      color: template.color,
    });
    await replaceEventTags(event.id, { tags: [template.department], subjectTags: [template.department] }, null, { tags: [], subjectTags: [] });
  }
}

run()
  .then(() => sequelize.close())
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
