const pool = require("../db/pool");
const ApiError = require("../utils/apiError");

function validateParticipantPayload(payload, isPartial = false) {
  const requiredFields = ["first_name", "last_name", "email"];

  if (!isPartial) {
    for (const field of requiredFields) {
      if (payload[field] === undefined || payload[field] === null || payload[field] === "") {
        throw new ApiError(400, `Field '${field}' is required.`);
      }
    }
  }

  if (payload.email !== undefined && !/^\S+@\S+\.\S+$/.test(payload.email)) {
    throw new ApiError(400, "Invalid email format.");
  }
}

function mapDbError(err) {
  if (err.code === "23505") {
    throw new ApiError(409, "Participant email must be unique.");
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

async function listParticipants(_req, res) {
  const result = await pool.query("SELECT * FROM participants ORDER BY id ASC");
  res.json(result.rows);
}

async function getParticipant(req, res) {
  const id = parseId(req.params.id, "Participant");
  const result = await pool.query("SELECT * FROM participants WHERE id = $1", [id]);

  if (!result.rowCount) {
    throw new ApiError(404, "Participant not found.");
  }

  res.json(result.rows[0]);
}

async function createParticipant(req, res) {
  validateParticipantPayload(req.body);

  const { first_name, last_name, email } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO participants (first_name, last_name, email)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [first_name, last_name, email]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    mapDbError(err);
  }
}

async function updateParticipant(req, res) {
  const id = parseId(req.params.id, "Participant");
  validateParticipantPayload(req.body, true);

  const existing = await pool.query("SELECT * FROM participants WHERE id = $1", [id]);
  if (!existing.rowCount) {
    throw new ApiError(404, "Participant not found.");
  }

  const current = existing.rows[0];
  const payload = {
    first_name: req.body.first_name ?? current.first_name,
    last_name: req.body.last_name ?? current.last_name,
    email: req.body.email ?? current.email,
  };

  try {
    const result = await pool.query(
      `UPDATE participants
       SET first_name = $1, last_name = $2, email = $3
       WHERE id = $4
       RETURNING *`,
      [payload.first_name, payload.last_name, payload.email, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    mapDbError(err);
  }
}

async function deleteParticipant(req, res) {
  const id = parseId(req.params.id, "Participant");
  const result = await pool.query("DELETE FROM participants WHERE id = $1 RETURNING *", [id]);

  if (!result.rowCount) {
    throw new ApiError(404, "Participant not found.");
  }

  res.status(204).send();
}

module.exports = {
  listParticipants,
  getParticipant,
  createParticipant,
  updateParticipant,
  deleteParticipant,
};
