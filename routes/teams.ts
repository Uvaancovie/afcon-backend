import express, { Request, Response } from 'express';
import Team from '../models/Team';
import Player from '../models/Player';
import { generateSquad, calculateTeamRating, generateManagerName } from '../services/playerGenerator';

const router = express.Router();

// Get all teams
router.get('/', async (req: Request, res: Response) => {
  try {
    const teams = await Team.find().sort({ createdAt: -1 });
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// Get team by ID with squad
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    // Get squad
    const teamId = String(team._id);
    const squad = await Player.find({ teamId }).sort({ jerseyNumber: 1 });
    
    res.json({ team, squad });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

// Get team's squad
router.get('/:id/squad', async (req: Request, res: Response) => {
  try {
    const squad = await Player.find({ teamId: req.params.id }).sort({ jerseyNumber: 1 });
    res.json(squad);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch squad' });
  }
});

// Create new team with auto-generated squad
router.post('/', async (req: Request, res: Response) => {
  try {
    const { country, repName, repEmail, managerName, autoGenerate = true } = req.body;
    
    // Create team
    const team = new Team({
      name: country,
      country,
      repName,
      repEmail,
      managerName: managerName || generateManagerName(),
      confederation: 'CAF',
      rating: 0
    });
    await team.save();
    
    // Generate squad if requested
    if (autoGenerate) {
      const teamId = String(team._id);
      const squadData = generateSquad(teamId, country);
      const players = await Player.insertMany(squadData);
      
      // Calculate and update team rating
      team.rating = calculateTeamRating(players);
      await team.save();
      
      return res.status(201).json({ team, squad: players });
    }
    
    res.status(201).json({ team, squad: [] });
  } catch (error) {
    console.error('Team creation error:', error);
    res.status(500).json({ error: 'Failed to create team' });
  }
});

// Update team
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const team = await Team.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update team' });
  }
});

// Delete team and its players
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    // Delete all players for this team
    await Player.deleteMany({ teamId: req.params.id });
    
    res.json({ message: 'Team and squad deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete team' });
  }
});

// Delete all teams and players
router.delete('/', async (req: Request, res: Response) => {
  try {
    await Team.deleteMany({});
    await Player.deleteMany({});
    res.json({ message: 'All teams and squads deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete teams' });
  }
});

export default router;
