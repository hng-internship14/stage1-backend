import express from "express";
import profileRoutes from "./routes/profileRoutes.js";
import errorMiddleware from "./middlewares/errorMiddleware.js";

const app = express();

app.use(express.json());

// routes
app.use("/api/v1", profileRoutes);

// health check
app.get("/", (req, res) => {
  res.json({ status: "OK" });
});

// error handler
app.use(errorMiddleware);

export default app;
