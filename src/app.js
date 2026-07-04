import express from "express";
import cors from "cors";
import errorMiddleware from "./middleware/errorMiddleware.js";
import routes from "./routes/index.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL, // frontend URL
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1", routes);

// global error handler MUST be after routes
app.use(errorMiddleware);

export default app;
