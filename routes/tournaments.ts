import express, { Request, Response } from 'express';
import Tournament from '../models/Tournament';
import Team from '../models/Team';
import Match from '../models/Match';
import Player from '../models/Player';
import { generateSquad, calculateTeamRating, generateManagerName } from '../services/playerGenerator';

const router = express.Router();

// Seed demo teams with full squads
router.post('/seed', async (req: Request, res: Response) => {
  try {
    console.log('Seeding teams with squads...');
    
    // Clear existing teams and players
    await Team.deleteMany({});
    await Player.deleteMany({});
    console.log('Cleared existing teams and players');
    
    // Create 8 demo teams
    const demoTeamData = [
      { name: 'Egypt', country: 'Egypt', repName: 'Mohamed El-Sayed', repEmail: 'egypt@afcon.com' },
      { name: 'Nigeria', country: 'Nigeria', repName: 'Chukwu Okafor', repEmail: 'nigeria@afcon.com' },
      { name: 'Senegal', country: 'Senegal', repName: 'Amadou Diallo', repEmail: 'senegal@afcon.com' },
      { name: 'Morocco', country: 'Morocco', repName: 'Hassan Benali', repEmail: 'morocco@afcon.com' },
      { name: 'South Africa', country: 'South Africa', repName: 'Thabo Mbeki', repEmail: 'southafrica@afcon.com' },
      { name: 'Ghana', country: 'Ghana', repName: 'Kwame Mensah', repEmail: 'ghana@afcon.com' },
      { name: 'Cameroon', country: 'Cameroon', repName: 'Samuel Eto\'o Jr', repEmail: 'cameroon@afcon.com' },
      { name: 'Tunisia', country: 'Tunisia', repName: 'Omar Ben Ali', repEmail: 'tunisia@afcon.com' },
    ];
    
    const createdTeams = [];
    
    for (const teamData of demoTeamData) {
      // Create team
      const team = new Team({
        ...teamData,
        managerName: generateManagerName(),
        confederation: 'CAF' as const,
        rating: 0
      });
      await team.save();
      
      // Generate and save squad
      const teamId = String(team._id);
      const squadData = generateSquad(teamId, teamData.country);
      const players = await Player.insertMany(squadData);
      
      // Calculate and update team rating
      team.rating = calculateTeamRating(players);
      await team.save();
      
      createdTeams.push(team);
      console.log(`✅ Created ${team.name} with ${players.length} players (Rating: ${team.rating})`);
    }
    
    console.log('All teams seeded successfully');
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
