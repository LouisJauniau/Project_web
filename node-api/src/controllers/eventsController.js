const pool = require("../db/pool");
const ApiError = require("../utils/apiError");

const VALID_STATUSES = new Set(["upcoming", "ongoing", "completed"]);

function validateEventPayload(payload, isPartial = false) {
  const requiredFields = ["title", "description", "date", "location", "status"];

  if (!isPartial) {
    for (const field of requiredFields) {
      if (payload[field] === undefined || payload[field] === null || payload[field] === "") {
        throw new ApiError(400, `Field '${field}' is required.`);
      }
    }
  }

  if (payload.status !== undefined && !VALID_STATUSES.has(payload.status)) {
    throw new ApiError(400, "Invalid status. Use one of: upcoming, ongoing, completed.");
  }

  if (payload.date !== undefined && Number.isNaN(Date.parse(payload.date))) {
    throw new ApiError(400, "Invalid date format. Use an ISO date string.");
  }
}

function parseId(idParam, resourceName) {
  const id = Number.parseInt(idParam, 10);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, `${resourceName} id must be a positive integer.`);
  }
  return id;
}

async function listEvents(_req, res) {
  const result = await pool.query("SELECT * FROM events ORDER BY id ASC");
  res.json(result.rows);
}

async function getEvent(req, res) {
  const id = parseId(req.params.id, "Event");
  const result = await pool.query("SELECT * FROM events WHERE id = $1", [id]);

  if (!result.rowCount) {
    throw new ApiError(404, "Event not found.");
  }

  res.json(result.rows[0]);
}

async function createEvent(req, res) {
  validateEventPayload(req.body);

  const { title, description, date, location, status } = req.body;

  const result = await pool.query(
    `INSERT INTO events (title, description, date, location, status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [title, description, date, location, status]
  );

  res.status(201).json(result.rows[0]);
}

async function updateEvent(req, res) {
  const id = parseId(req.params.id, "Event");
  validateEventPayload(req.body, true);

  const existing = await pool.query("SELECT * FROM events WHERE id = $1", [id]);
  if (!existing.rowCount) {
    throw new ApiError(404, "Event not found.");
  }

  const current = existing.rows[0];
  const payload = {
    title: req.body.title ?? current.title,
    description: req.body.description ?? current.description,
    date: req.body.date ?? current.date,
    location: req.body.location ?? current.location,
    status: req.body.status ?? current.status,
  };

  const result = await pool.query(
    `UPDATE events
     SET title = $1, description = $2, date = $3, location = $4, status = $5
     WHERE id = $6
     RETURNING *`,
    [payload.title, payload.description, payload.date, payload.location, payload.status, id]
  );

  res.json(result.rows[0]);
}

async function deleteEvent(req, res) {
  const id = parseId(req.params.id, "Event");
  const result = await pool.query("DELETE FROM events WHERE id = $1 RETURNING *", [id]);

  if (!result.rowCount) {
    throw new ApiError(404, "Event not found.");
  }

  res.status(204).send();
}

module.exports = {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
};
