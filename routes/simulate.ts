import express, { Request, Response } from 'express';
import Match from '../models/Match';
import Tournament from '../models/Tournament';
import { generateCommentary } from '../services/geminiService';

const router = express.Router();

// Simulate a single match with Gemini AI
router.post('/match/:matchId', async (req: Request, res: Response) => {
  try {
    const match = await Match.findById(req.params.matchId);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    if (match.status === 'completed') {
      return res.status(400).json({ error: 'Match already completed' });
    }

    // Update match status
    match.status = 'in_progress';
    await match.save();

    // Simulate match using Poisson distribution
    const baseRate = 1.5;
    const scoreA = Math.floor(Math.random() * (baseRate * 2)) + Math.floor(Math.random() * 2);
    const scoreB = Math.floor(Math.random() * (baseRate * 2)) + Math.floor(Math.random() * 2);

    // Determine winner
    let finalScoreA = scoreA;
    let finalScoreB = scoreB;
    let winner = '';

    if (scoreA > scoreB) {
      winner = match.teamA;
    } else if (scoreB > scoreA) {
      winner = match.teamB;
    } else {
      // Handle draw - add extra time goals
      const extraA = Math.random() > 0.5 ? 1 : 0;
      const extraB = Math.random() > 0.5 ? 1 : 0;
      finalScoreA += extraA;
      finalScoreB += extraB;
      
      if (finalScoreA > finalScoreB) {
        winner = match.teamA;
      } else if (finalScoreB > finalScoreA) {
        winner = match.teamB;
      } else {
        // Penalty shootout
        winner = Math.random() > 0.5 ? match.teamA : match.teamB;
      }
    }

      // Generate AI commentary
      let commentary = `${match.teamA} ${finalScoreA} - ${finalScoreB} ${match.teamB}. Winner: ${winner}`;
      try {
        commentary = await generateCommentary(
          'fulltime',
          { name: match.teamA, score: finalScoreA } as any,
          { name: match.teamB, score: finalScoreB } as any,
          90
        );
      } catch (error) {
        console.warn('Failed to generate AI commentary, using fallback:', error instanceof Error ? error.message : String(error));
      }    // Update match
    match.scoreA = finalScoreA;
    match.scoreB = finalScoreB;
    match.winner = winner;
    match.commentary = commentary;
    match.status = 'completed';
    match.completedAt = Date.now();
    await match.save();

    console.log(`Match completed: ${match.teamA} ${finalScoreA} - ${finalScoreB} ${match.teamB} (Winner: ${winner})`);

    res.json({ match, commentary });
  } catch (error) {
    console.error('Match simulation error:', error);
    res.status(500).json({ 
      error: 'Failed to simulate match',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Simulate entire tournament round
router.post('/round/:tournamentId', async (req: Request, res: Response) => {
  try {
    const tournament = await Tournament.findById(req.params.tournamentId);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    // Get pending matches for current stage
    const matches = await Match.find({
      tournamentId: tournament._id,
      stage: tournament.stage,
      status: 'pending'
    });

    console.log(`Simulating ${matches.length} matches for ${tournament.stage}`);

    const results = [];
    for (const match of matches) {
      // Simulate each match
      match.status = 'in_progress';
      await match.save();

      const baseRate = 1.5;
      const scoreA = Math.floor(Math.random() * (baseRate * 2)) + Math.floor(Math.random() * 2);
      const scoreB = Math.floor(Math.random() * (baseRate * 2)) + Math.floor(Math.random() * 2);

      let finalScoreA = scoreA;
      let finalScoreB = scoreB;
      let winner = '';

      if (scoreA > scoreB) {
        winner = match.teamA;
      } else if (scoreB > scoreA) {
        winner = match.teamB;
      } else {
        const extraA = Math.random() > 0.5 ? 1 : 0;
        const extraB = Math.random() > 0.5 ? 1 : 0;
        finalScoreA += extraA;
        finalScoreB += extraB;
        
        if (finalScoreA > finalScoreB) {
          winner = match.teamA;
        } else if (finalScoreB > finalScoreA) {
          winner = match.teamB;
        } else {
          winner = Math.random() > 0.5 ? match.teamA : match.teamB;
        }
      }

      let commentary = `${match.teamA} ${finalScoreA} - ${finalScoreB} ${match.teamB}. Winner: ${winner}`;
      try {
        commentary = await generateCommentary(
          'fulltime',
          { name: match.teamA, score: finalScoreA } as any,
          { name: match.teamB, score: finalScoreB } as any,
          90
        );
      } catch (error) {
        console.warn('Failed to generate AI commentary, using fallback:', error instanceof Error ? error.message : String(error));
      }

      match.scoreA = finalScoreA;
      match.scoreB = finalScoreB;
      match.winner = winner;
      match.commentary = commentary;
      match.status = 'completed';
      match.completedAt = Date.now();
      await match.save();

      results.push({
        match: `${match.teamA} ${finalScoreA} - ${finalScoreB} ${match.teamB}`,
        winner
      });

      console.log(`✅ ${match.teamA} ${finalScoreA} - ${finalScoreB} ${match.teamB} (Winner: ${winner})`);
    }

    // Check if round is complete and create next round
    const allMatches = await Match.find({
      tournamentId: tournament._id,
      stage: tournament.stage
    });

    const allCompleted = allMatches.every(m => m.status === 'completed');

    if (allCompleted) {
      // Progress to next stage
      if (tournament.stage === 'quarter_finals') {
        tournament.stage = 'semi_finals';
        
        // Create semi-final matches
        const winners = allMatches.map(m => m.winner).filter(Boolean);
        for (let i = 0; i < 2; i++) {
          const semiMatch = new Match({
            tournamentId: tournament._id,
            stage: 'semi_finals',
            matchNumber: i + 1,
            teamA: winners[i * 2],
            teamB: winners[i * 2 + 1],
            status: 'pending'
          });
          await semiMatch.save();
        }
        console.log('Created semi-final matches');
      } else if (tournament.stage === 'semi_finals') {
        tournament.stage = 'final';
        
        // Create final match
        const winners = allMatches.map(m => m.winner).filter(Boolean);
        const finalMatch = new Match({
          tournamentId: tournament._id,
          stage: 'final',
          matchNumber: 1,
          teamA: winners[0],
          teamB: winners[1],
          status: 'pending'
        });
        await finalMatch.save();
        console.log('Created final match');
      } else if (tournament.stage === 'final') {
        tournament.status = 'completed';
        console.log('Tournament completed!');
      }

      await tournament.save();
    }

    res.json({ 
      results, 
      tournament,
      nextStage: tournament.stage 
    });
  } catch (error) {
    console.error('Round simulation error:', error);
    res.status(500).json({ 
      error: 'Failed to simulate round',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;
