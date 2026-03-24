const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
} = require("../controllers/eventsController");

const router = express.Router();

router.get("/", asyncHandler(listEvents));
router.get("/:id", asyncHandler(getEvent));
router.post("/", asyncHandler(createEvent));
router.put("/:id", asyncHandler(updateEvent));
router.patch("/:id", asyncHandler(updateEvent));
router.delete("/:id", asyncHandler(deleteEvent));

module.exports = router;
