import express, { Request, Response } from 'express';
import TournamentArchive from '../models/TournamentArchive';
import TeamAnalytics from '../models/TeamAnalytics';

const router = express.Router();

// Get tournament history
router.get('/history', async (req: Request, res: Response) => {
  try {
    const archives = await TournamentArchive.find().sort({ completedAt: -1 });
    res.json(archives);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tournament history' });
  }
});

// Get team analytics
router.get('/teams/:teamName', async (req: Request, res: Response) => {
  try {
    const analytics = await TeamAnalytics.findOne({ teamName: req.params.teamName });
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch team analytics' });
  }
});

// Get all team analytics
router.get('/teams', async (req: Request, res: Response) => {
  try {
    const analytics = await TeamAnalytics.find().sort({ championshipWins: -1, wins: -1 });
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch team analytics' });
  }
});

// Archive tournament
router.post('/archive', async (req: Request, res: Response) => {
  try {
    const archive = new TournamentArchive(req.body);
    await archive.save();
    
    // Update team analytics
    const { winner, runnerUp, matches, teams } = req.body;
    
    for (const teamName of teams) {
      let analytics = await TeamAnalytics.findOne({ teamName });
      
      if (!analytics) {
        analytics = new TeamAnalytics({ teamName, repEmail: '' });
      }
      
      analytics.totalTournaments += 1;
      
      if (teamName === winner) {
        analytics.championshipWins += 1;
      }
      if (teamName === runnerUp) {
        analytics.runnerUpFinishes += 1;
      }
      
      // Calculate wins/losses from matches
      matches.forEach((match: any) => {
        if (match.teamA === teamName) {
          analytics!.goalsScored += match.scoreA;
          analytics!.goalsConceded += match.scoreB;
          if (match.winner === teamName) analytics!.wins += 1;
          else analytics!.losses += 1;
        } else if (match.teamB === teamName) {
          analytics!.goalsScored += match.scoreB;
          analytics!.goalsConceded += match.scoreA;
          if (match.winner === teamName) analytics!.wins += 1;
          else analytics!.losses += 1;
        }
      });
      
      analytics.lastUpdated = Date.now();
      await analytics.save();
    }
    
    res.status(201).json(archive);
  } catch (error) {
    res.status(500).json({ error: 'Failed to archive tournament' });
  }
});

export default router;
