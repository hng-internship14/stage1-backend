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

app.use(express.json());


app.use("/api/profiles", profileRoutes);


app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "HNG Stage 1 Backend is running 🚀"
  });
});

app.use(errorMiddleware);

export default app;