const errorMiddleware = (err, req, res, next) => {
  console.error("Unhandled Error:", err);

  const status = err.status || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({
    status: "error",
    message
  });
};

export default errorMiddleware;