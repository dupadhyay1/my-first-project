const express = require('express');
const db = require('../db');

const router = express.Router();

// Get plays with optional filters: formation_id, play_type, search
router.get('/', async (req, res) => {
  const { formation_id, play_type, search } = req.query;
  const conditions = [];
  const params = [];

  if (formation_id) {
    params.push(formation_id);
    conditions.push(`formation_id = $${params.length}`);
  }
  if (play_type) {
    params.push(play_type);
    conditions.push(`play_type = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`LOWER(name) LIKE LOWER($${params.length})`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const result = await db.query(
      `SELECT play_id, formation_id, name, play_type, notes, created_at
       FROM plays
       ${whereClause}
       ORDER BY created_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch plays' });
  }
});

// Create play
router.post('/', async (req, res) => {
  const { formation_id, name, play_type, notes } = req.body;
  if (!formation_id || !name || !play_type) {
    return res.status(400).json({ error: 'formation_id, name, and play_type are required' });
  }
  try {
    const result = await db.query(
      'INSERT INTO plays (formation_id, name, play_type, notes) VALUES ($1, $2, $3, $4) RETURNING *',
      [formation_id, name, play_type, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create play' });
  }
});

// Update play
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { formation_id, name, play_type, notes } = req.body;
  try {
    const result = await db.query(
      'UPDATE plays SET formation_id = $1, name = $2, play_type = $3, notes = $4 WHERE play_id = $5 RETURNING *',
      [formation_id, name, play_type, notes, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Play not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update play' });
  }
});

// Delete play
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM plays WHERE play_id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Play not found' });
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete play' });
  }
});

module.exports = router;


