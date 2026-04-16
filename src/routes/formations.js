const express = require('express');
const db = require('../db');

const router = express.Router();

// Get one formation by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      'SELECT formation_id, name, personnel, description, created_at FROM formations WHERE formation_id = $1',
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Formation not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch formation' });
  }
});

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
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'name is required' });
  }
  try {
    const result = await db.query(
      'INSERT INTO formations (name, personnel, description) VALUES ($1, $2, $3) RETURNING *',
      [name.trim(), personnel, description]
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
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'name is required' });
  }
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
    const result = await db.query(
      'DELETE FROM formations WHERE formation_id = $1 RETURNING *',
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Formation not found' });
    }
    res.status(200).json({ message: 'Formation deleted', deleted: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete formation' });
  }
});

// Get all plays for a specific formation (sub-resource)
router.get('/:id/plays', async (req, res) => {
  const { id } = req.params;
  try {
    // Confirm the formation exists first
    const formationCheck = await db.query(
      'SELECT formation_id FROM formations WHERE formation_id = $1',
      [id]
    );
    if (formationCheck.rowCount === 0) {
      return res.status(404).json({ error: 'Formation not found' });
    }
    const result = await db.query(
      'SELECT play_id, formation_id, name, play_type, notes, created_at FROM plays WHERE formation_id = $1 ORDER BY created_at DESC',
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch plays for formation' });
  }
});

// Maps personnel grouping to NFL teams known for using that package
const personnelMap = {
  '10': ['Miami Dolphins', 'Los Angeles Rams', 'Cincinnati Bengals', 'Detroit Lions', 'Houston Texans', 'Minnesota Vikings'],
  '11': ['Kansas City Chiefs', 'Miami Dolphins', 'Buffalo Bills', 'Cincinnati Bengals', 'Dallas Cowboys', 'Los Angeles Rams'],
  '12': ['San Francisco 49ers', 'Philadelphia Eagles', 'Detroit Lions', 'Cleveland Browns', 'Atlanta Falcons', 'Kansas City Chiefs'],
  '13': ['San Francisco 49ers', 'Philadelphia Eagles', 'New England Patriots', 'Tampa Bay Buccaneers', 'Baltimore Ravens'],
  '21': ['Baltimore Ravens', 'Tennessee Titans', 'Green Bay Packers', 'New York Giants', 'Pittsburgh Steelers', 'Los Angeles Rams'],
  '22': ['Baltimore Ravens', 'Tennessee Titans', 'New England Patriots', 'Chicago Bears', 'New York Jets', 'Pittsburgh Steelers'],
};

// Public API proxy: fetch NFL teams from ESPN and return alongside formation data
router.get('/:id/nfl-teams', async (req, res) => {
  const { id } = req.params;
  try {
    // Step 1: look up the formation in our database
    const formationResult = await db.query(
      'SELECT formation_id, name, personnel, description FROM formations WHERE formation_id = $1',
      [id]
    );
    if (formationResult.rowCount === 0) {
      return res.status(404).json({ error: 'Formation not found' });
    }
    const formation = formationResult.rows[0];

    // Step 2: call ESPN public API for all 32 NFL teams (no key required)
    const response = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams?limit=32'
    );
    if (!response.ok) {
      return res.status(500).json({ error: 'ESPN API request failed' });
    }
    const data = await response.json();

    // Step 3: filter teams by personnel group using the map above
    const allTeams = data.sports[0].leagues[0].teams.map((entry) => entry.team);
    const personnel = (formation.personnel || '').trim();
    const targetNames = personnelMap[personnel] || null;

    let teams;
    if (targetNames) {
      // Filter ESPN results to only teams in the personnel map
      teams = allTeams
        .filter((t) => targetNames.includes(t.displayName))
        .map((t) => ({
          id: t.id,
          name: t.displayName,
          badge: t.logos?.[0]?.href || null,
          location: t.location || null,
        }));
    } else {
      // Unknown personnel — return 6 teams offset by formation_id
      const offset = (Number(id) - 1) % Math.max(allTeams.length - 6, 1);
      teams = allTeams.slice(offset, offset + 6).map((t) => ({
        id: t.id,
        name: t.displayName,
        badge: t.logos?.[0]?.href || null,
        location: t.location || null,
      }));
    }

    res.json({ formation, teams, personnel });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch NFL teams' });
  }
});

module.exports = router;


