import express from "express";
import cors from "cors";
import profileRoutes from "./routes/profileRoutes.js";
import errorMiddleware from "./middlewares/errorMiddleware.js";

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// routes
app.use("/api/v1/profiles", profileRoutes);

// health check
app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "HNG Stage 1 Backend is running",
  });
});

// error handler (MUST be last)
app.use(errorMiddleware);

export default app;