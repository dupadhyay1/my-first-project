CREATE TABLE IF NOT EXISTS formations (
  formation_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  personnel VARCHAR(50),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plays (
  play_id SERIAL PRIMARY KEY,
  formation_id INTEGER NOT NULL REFERENCES formations(formation_id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  play_type VARCHAR(20) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assignments (
  assignment_id SERIAL PRIMARY KEY,
  play_id INTEGER NOT NULL REFERENCES plays(play_id) ON DELETE CASCADE,
  position VARCHAR(20) NOT NULL,
  assignment_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sample data: at least 5 rows per table

INSERT INTO formations (name, personnel, description)
VALUES
  ('Trips Right', '11', '3 WR to the right, 1 TE attached left'),
  ('I-Right', '21', 'Traditional I-formation, strong right'),
  ('Gun Doubles', '10', 'Shotgun with 2x2 receivers'),
  ('Ace Tight', '12', 'Balanced 2 TE set'),
  ('Bunch Left', '11', 'WR bunch to the left');

INSERT INTO plays (formation_id, name, play_type, notes)
VALUES
  (1, 'Trips Flood', 'pass', '3-level flood to the field'),
  (1, 'Bubble Screen Right', 'pass', 'Quick perimeter screen to #3'),
  (2, 'Iso Strong Right', 'run', 'Lead block on Mike linebacker'),
  (3, 'Inside Zone Left', 'run', 'Zone rules, read backside end'),
  (5, 'Bunch Smash', 'pass', 'High-low on the corner');

INSERT INTO assignments (play_id, position, assignment_text)
VALUES
  (1, 'WR1', 'Go route clearing outside third'),
  (1, 'WR2', '15-yard out breaking to sideline'),
  (1, 'WR3', 'Flat route to the numbers at 3-5 yards'),
  (3, 'FB', 'Lead through playside A-gap for Mike'),
  (4, 'LT', 'Zone step left, covered/uncovered rules');


