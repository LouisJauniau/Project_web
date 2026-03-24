const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const {
  listParticipants,
  getParticipant,
  createParticipant,
  updateParticipant,
  deleteParticipant,
} = require("../controllers/participantsController");

const router = express.Router();

router.get("/", asyncHandler(listParticipants));
router.get("/:id", asyncHandler(getParticipant));
router.post("/", asyncHandler(createParticipant));
router.put("/:id", asyncHandler(updateParticipant));
router.patch("/:id", asyncHandler(updateParticipant));
router.delete("/:id", asyncHandler(deleteParticipant));

module.exports = router;
