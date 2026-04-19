import express from "express";
import cors from "cors";
import profileRoutes from "./routes/profileRoutes.js";
import errorMiddleware from "./middlewares/errorMiddleware.js";

const app = express();

app.use(cors());
app.use(express.json());

// ROUTES
app.use("/api", profileRoutes);

// HEALTH CHECK
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "HNG Stage 1 Backend is running",
  });
});

// ERROR HANDLER
app.use(errorMiddleware);

export default app;