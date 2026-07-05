import connectDB from "../config/db.js";
import seedPermissions from "./seedPermissions.js";
import seedSystemRoles from "./seedSystemRoles.js";

const seedAll = async () => {
  try {
    await connectDB();

    console.log("Seeding permissions...");
    const permissionResult = await seedPermissions();
    console.log(`Seeded ${permissionResult.count} permissions`);

    console.log("Seeding system roles...");
    const roleResult = await seedSystemRoles();
    console.log(`Seeded ${roleResult.count} system roles`);

    console.log("All seeds completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
};

seedAll();
