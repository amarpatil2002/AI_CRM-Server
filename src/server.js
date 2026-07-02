import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/db.js";

dotenv.config();

const port = process.env.PORT || 5000;

(async function () {
  try {
    await connectDB();

    app.listen(port, () => {
      console.log(`Server linsting at port ${port}`);
    });
  } catch (error) {
    console.log(error);
  }
})();
