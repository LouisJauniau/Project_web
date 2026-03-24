const pool = require("../db/pool");
const ApiError = require("../utils/apiError");

function validateRegistrationPayload(payload, isPartial = false) {
  const requiredFields = ["participant_id", "event_id"];

  if (!isPartial) {
    for (const field of requiredFields) {
      if (payload[field] === undefined || payload[field] === null) {
        throw new ApiError(400, `Field '${field}' is required.`);
      }
    }
  }

  const idsToCheck = [payload.participant_id, payload.event_id].filter((value) => value !== undefined);
  for (const id of idsToCheck) {
    if (!Number.isInteger(Number(id))) {
      throw new ApiError(400, "participant_id and event_id must be integers.");
    }
  }
}

function mapDbError(err) {
  if (err.code === "23505") {
    throw new ApiError(409, "Participant is already registered for this event.");
  }

  if (err.code === "23503") {
    throw new ApiError(400, "participant_id or event_id does not exist.");
  }

  throw err;
}

function parseId(idParam, resourceName) {
  const id = Number.parseInt(idParam, 10);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, `${resourceName} id must be a positive integer.`);
  }
  return id;
}

async function listRegistrations(_req, res) {
  const result = await pool.query(
    `SELECT r.id,
            r.participant_id,
            r.event_id,
            r.registration_date,
            p.first_name,
            p.last_name,
            e.title AS event_title
     FROM registrations r
     JOIN participants p ON p.id = r.participant_id
     JOIN events e ON e.id = r.event_id
     ORDER BY r.id ASC`
  );

  res.json(result.rows);
}

async function getRegistration(req, res) {
  const id = parseId(req.params.id, "Registration");
  const result = await pool.query("SELECT * FROM registrations WHERE id = $1", [id]);

  if (!result.rowCount) {
    throw new ApiError(404, "Registration not found.");
  }

  res.json(result.rows[0]);
}

async function createRegistration(req, res) {
  validateRegistrationPayload(req.body);

  const participantId = Number(req.body.participant_id);
  const eventId = Number(req.body.event_id);

  try {
    const result = await pool.query(
      `INSERT INTO registrations (participant_id, event_id)
       VALUES ($1, $2)
       RETURNING *`,
      [participantId, eventId]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    mapDbError(err);
  }
}

async function updateRegistration(req, res) {
  const id = parseId(req.params.id, "Registration");
  validateRegistrationPayload(req.body, true);

  const existing = await pool.query("SELECT * FROM registrations WHERE id = $1", [id]);
  if (!existing.rowCount) {
    throw new ApiError(404, "Registration not found.");
  }

  const current = existing.rows[0];
  const payload = {
    participant_id: req.body.participant_id ?? current.participant_id,
    event_id: req.body.event_id ?? current.event_id,
  };

  try {
    const result = await pool.query(
      `UPDATE registrations
       SET participant_id = $1,
           event_id = $2
       WHERE id = $3
       RETURNING *`,
      [payload.participant_id, payload.event_id, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    mapDbError(err);
  }
}

async function deleteRegistration(req, res) {
  const id = parseId(req.params.id, "Registration");
  const result = await pool.query("DELETE FROM registrations WHERE id = $1 RETURNING *", [id]);

  if (!result.rowCount) {
    throw new ApiError(404, "Registration not found.");
  }

  res.status(204).send();
}

module.exports = {
  listRegistrations,
  getRegistration,
  createRegistration,
  updateRegistration,
  deleteRegistration,
};
