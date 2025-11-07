import express, { Request, Response } from 'express';
import Tournament from '../models/Tournament';
import Team from '../models/Team';
import Match from '../models/Match';

const router = express.Router();

// Seed demo teams
router.post('/seed', async (req: Request, res: Response) => {
  try {
    console.log('Seeding teams...');
    
    // Clear existing teams
    await Team.deleteMany({});
    console.log('Cleared existing teams');
    
    // Create 8 demo teams
    const demoTeams = [
      { name: 'Egypt', country: 'Egypt', repName: 'Manager 1', repEmail: 'egypt@example.com', confederation: 'CAF' },
      { name: 'Nigeria', country: 'Nigeria', repName: 'Manager 2', repEmail: 'nigeria@example.com', confederation: 'CAF' },
      { name: 'Senegal', country: 'Senegal', repName: 'Manager 3', repEmail: 'senegal@example.com', confederation: 'CAF' },
      { name: 'Morocco', country: 'Morocco', repName: 'Manager 4', repEmail: 'morocco@example.com', confederation: 'CAF' },
      { name: 'South Africa', country: 'South Africa', repName: 'Manager 5', repEmail: 'southafrica@example.com', confederation: 'CAF' },
      { name: 'Ghana', country: 'Ghana', repName: 'Manager 6', repEmail: 'ghana@example.com', confederation: 'CAF' },
      { name: 'Cameroon', country: 'Cameroon', repName: 'Manager 7', repEmail: 'cameroon@example.com', confederation: 'CAF' },
      { name: 'Tunisia', country: 'Tunisia', repName: 'Manager 8', repEmail: 'tunisia@example.com', confederation: 'CAF' },
    ];
    
    const createdTeams = await Team.insertMany(demoTeams);
    console.log('Created teams:', createdTeams.length);
    
    res.status(201).json({ message: 'Teams seeded successfully', teams: createdTeams });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ error: 'Failed to seed teams', details: error instanceof Error ? error.message : String(error) });
  }
});

// Get all tournaments
router.get('/', async (req: Request, res: Response) => {
  try {
    const tournaments = await Tournament.find().sort({ createdAt: -1 });
    res.json(tournaments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tournaments' });
  }
});

// Get active tournament
router.get('/active', async (req: Request, res: Response) => {
  try {
    const tournament = await Tournament.findOne({ status: { $in: ['pending', 'active'] } }).sort({ createdAt: -1 });
    res.json(tournament);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch active tournament' });
  }
});

// Get tournament by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }
    res.json(tournament);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tournament' });
  }
});

// Create and start new tournament
router.post('/start', async (req: Request, res: Response) => {
  try {
    console.log('Starting tournament...');
    
    // Get all teams
    const teams = await Team.find();
    console.log(`Found ${teams.length} teams`);
    
    if (teams.length !== 8) {
      return res.status(400).json({ 
        error: `Exactly 8 teams required to start tournament. Current: ${teams.length}` 
      });
    }

    // Create tournament
    const tournament = new Tournament({
      name: 'African Nations League',
      stage: 'quarter_finals',
      status: 'active',
      currentMatchIndex: 0,
      startedAt: Date.now()
    });
    await tournament.save();
    console.log('Tournament created:', tournament._id);

    // Create quarter-final matches
    const matchesCreated = [];
    for (let i = 0; i < 4; i++) {
      const match = new Match({
        tournamentId: tournament._id,
        stage: 'quarter_finals',
        matchNumber: i + 1,
        teamA: teams[i * 2].name,
        teamB: teams[i * 2 + 1].name,
        status: 'pending'
      });
      await match.save();
      matchesCreated.push(match);
      console.log(`Match ${i + 1}: ${match.teamA} vs ${match.teamB}`);
    }

    console.log(`Tournament started with ${matchesCreated.length} matches`);
    res.status(201).json({ 
      tournament, 
      matches: matchesCreated,
      message: 'Tournament started successfully' 
    });
  } catch (error) {
    console.error('Start tournament error:', error);
    res.status(500).json({ 
      error: 'Failed to start tournament',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Reset tournament
router.post('/reset', async (req: Request, res: Response) => {
  try {
    await Tournament.deleteMany({});
    await Match.deleteMany({});
    await Team.updateMany({}, { $set: { isSeeded: false, isEliminated: false } });
    res.json({ message: 'Tournament reset successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset tournament' });
  }
});

export default router;
