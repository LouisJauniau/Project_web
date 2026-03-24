const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const {
  listRegistrations,
  getRegistration,
  createRegistration,
  updateRegistration,
  deleteRegistration,
} = require("../controllers/registrationsController");

const router = express.Router();

router.get("/", asyncHandler(listRegistrations));
router.get("/:id", asyncHandler(getRegistration));
router.post("/", asyncHandler(createRegistration));
router.put("/:id", asyncHandler(updateRegistration));
router.patch("/:id", asyncHandler(updateRegistration));
router.delete("/:id", asyncHandler(deleteRegistration));

module.exports = router;
