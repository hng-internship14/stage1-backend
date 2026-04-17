export const errorHandler = (err, req, res, next) => {
  console.error("🔥 ERROR:", err);

  res.status(500).json({
    status: "error",
    message: err.message || "Internal Server Error",
  });
};