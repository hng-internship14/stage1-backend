import express from "express";
import cors from "cors";
import profileRoutes from "./routes/profileRoutes.js";
import errorMiddleware from "./middlewares/errorMiddleware.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", profileRoutes);

// health check
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "HNG Stage 1 Backend is running 🚀"
  });
});

// error handler
app.use(errorMiddleware);

export default app;