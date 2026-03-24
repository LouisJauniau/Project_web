const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const eventsRoutes = require("./routes/eventsRoutes");
const participantsRoutes = require("./routes/participantsRoutes");
const registrationsRoutes = require("./routes/registrationsRoutes");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/events", eventsRoutes);
app.use("/api/participants", participantsRoutes);
app.use("/api/registrations", registrationsRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
