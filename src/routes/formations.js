const express = require('express');
const db = require('../db');

const router = express.Router();

// Get all formations
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT formation_id, name, personnel, description, created_at FROM formations ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch formations' });
  }
});

// Create formation
router.post('/', async (req, res) => {
  const { name, personnel, description } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  try {
    const result = await db.query(
      'INSERT INTO formations (name, personnel, description) VALUES ($1, $2, $3) RETURNING *',
      [name, personnel, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create formation' });
  }
});

// Update formation
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, personnel, description } = req.body;
  try {
    const result = await db.query(
      'UPDATE formations SET name = $1, personnel = $2, description = $3 WHERE formation_id = $4 RETURNING *',
      [name, personnel, description, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Formation not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update formation' });
  }
});

// Delete formation
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM formations WHERE formation_id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Formation not found' });
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete formation' });
  }
});

module.exports = router;


