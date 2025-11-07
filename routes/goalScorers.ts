import express, { Request, Response } from 'express';
import GoalScorer from '../models/GoalScorer';

const router = express.Router();

// Get goal scorers leaderboard for a tournament
router.get('/tournament/:tournamentId', async (req: Request, res: Response) => {
  try {
    const { tournamentId } = req.params;
    
    // Aggregate goal scorers
    const leaderboard = await GoalScorer.aggregate([
      { $match: { tournamentId: tournamentId } },
      {
        $group: {
          _id: '$playerName',
          goals: { $sum: 1 },
          teamName: { $first: '$teamName' },
          penalties: { $sum: { $cond: ['$isPenalty', 1, 0] } },
          minutes: { $push: '$minute' }
        }
      },
      { $sort: { goals: -1, penalties: 1 } },
      { $limit: 20 }
    ]);
    
    res.json(leaderboard);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch goal scorers' });
  }
});

// Get all goal scorers for a match
router.get('/match/:matchId', async (req: Request, res: Response) => {
  try {
    const goalScorers = await GoalScorer.find({ matchId: req.params.matchId })
      .sort({ minute: 1 });
    res.json(goalScorers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch match goal scorers' });
  }
});

// Get current tournament leaderboard (most recent active tournament)
router.get('/current', async (req: Request, res: Response) => {
  try {
    // Get most recent tournament
    const Tournament = require('../models/Tournament').default;
    const tournament = await Tournament.findOne({ 
      status: { $in: ['pending', 'active', 'completed'] } 
    }).sort({ createdAt: -1 });
    
    if (!tournament) {
      return res.json([]);
    }
    
    // Get leaderboard for that tournament
    const leaderboard = await GoalScorer.aggregate([
      { $match: { tournamentId: tournament._id.toString() } },
      {
        $group: {
          _id: '$playerName',
          goals: { $sum: 1 },
          teamName: { $first: '$teamName' },
          penalties: { $sum: { $cond: ['$isPenalty', 1, 0] } },
          minutes: { $push: '$minute' }
        }
      },
      { $sort: { goals: -1, penalties: 1 } },
      { $limit: 20 }
    ]);
    
    res.json(leaderboard);
  } catch (error) {
    console.error('Current leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch current leaderboard' });
  }
});

export default router;
