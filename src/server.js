import "./config/env.js";

import app from "./app.js";
import connectDB from "./config/db.js";

const port = process.env.PORT || 5000;

(async function () {
  try {
    await connectDB();

    app.listen(port, () => {
      console.log(`Server listening at port ${port}`);
    });
  } catch (error) {
    console.log(error);
  }
})();
