import express, { Request, Response } from 'express';
import Match from '../models/Match';

const router = express.Router();

// Get all matches
router.get('/', async (req: Request, res: Response) => {
  try {
    const { tournamentId, stage } = req.query;
    const filter: any = {};
    if (tournamentId) filter.tournamentId = tournamentId;
    if (stage) filter.stage = stage;
    
    const matches = await Match.find(filter).sort({ matchNumber: 1 });
    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// Get match by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    res.json(match);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch match' });
  }
});

// Update match (simulate result)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const match = await Match.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    res.json(match);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update match' });
  }
});

export default router;
