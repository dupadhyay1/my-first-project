const express = require('express');
const db = require('../db');

const router = express.Router();

// Get assignments for a given play_id
router.get('/', async (req, res) => {
  const { play_id } = req.query;
  if (!play_id) {
    return res.status(400).json({ error: 'play_id query param is required' });
  }
  try {
    const result = await db.query(
      'SELECT assignment_id, play_id, position, assignment_text, created_at FROM assignments WHERE play_id = $1 ORDER BY created_at ASC',
      [play_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Create assignment
router.post('/', async (req, res) => {
  const { play_id, position, assignment_text } = req.body;
  if (!play_id || !position || !assignment_text) {
    return res.status(400).json({ error: 'play_id, position, and assignment_text are required' });
  }
  try {
    const result = await db.query(
      'INSERT INTO assignments (play_id, position, assignment_text) VALUES ($1, $2, $3) RETURNING *',
      [play_id, position, assignment_text]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

// Update assignment
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { position, assignment_text } = req.body;
  try {
    const result = await db.query(
      'UPDATE assignments SET position = $1, assignment_text = $2 WHERE assignment_id = $3 RETURNING *',
      [position, assignment_text, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update assignment' });
  }
});

// Delete assignment
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM assignments WHERE assignment_id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

module.exports = router;


