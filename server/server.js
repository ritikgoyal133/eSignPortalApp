import express from "express";
import dotenv from "dotenv";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname } from "path";
import helmet from "helmet";
import connectDB from "./config/db.js";
import documentRoutes from "./routes/documentRoute.js";

// Set up __dirname using import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();

// Middleware setup
app.use(express.json());
app.use(helmet());

// Allow cross-origin requests dynamically
const allowedOrigin = process.env.BASE_URL;
app.use(
  cors({
    origin: allowedOrigin,
    methods: ["GET", "POST"],
    credentials: true,
  })
);

// Add headers for iframe embedding dynamically
app.use((req, res, next) => {
  res.setHeader("X-Frame-Options", `ALLOW-FROM ${allowedOrigin}`);
  res.setHeader(
    "Content-Security-Policy",
    `frame-ancestors 'self' ${allowedOrigin}`
  );
  next();
});

// Serve static files from the "uploads" folder
app.use("/api/uploads", express.static(path.join(__dirname, "uploads")));

connectDB();

// Routes
app.use("/api", documentRoutes);

// Handle undefined routes
app.all("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// For production
if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
  });
} else {
  // For development
  app.get("/", (req, res) => {
    res.send("API is running...");
  });
}

// Error handling middleware for unexpected errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// Define and start the server
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
