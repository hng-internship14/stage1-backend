import express from "express";
import cors from "cors";
import profileRoutes from "./routes/profileRoutes.js";
import errorMiddleware from "./middlewares/errorMiddleware.js";

const app = express();


app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "DELETE"],
  allowedHeaders: ["Content-Type"]
}));


app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/profiles", profileRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "HNG Stage 1 Backend is running"
  });
});

// Error handler - MUST be last
app.use(errorMiddleware);

export default app;