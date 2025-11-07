import express, { Request, Response } from 'express';
import Match from '../models/Match';
import GoalScorer from '../models/GoalScorer';
import Player from '../models/Player';
import Team from '../models/Team';
import Tournament from '../models/Tournament';
import { generateCommentary } from '../services/geminiService';
import { sendMatchResultEmail } from '../services/emailService';

const router = express.Router();

// Simulate a match
router.post('/:matchId', async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;
    const match = await Match.findById(matchId);

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    if (match.status === 'completed') {
      return res.status(400).json({ error: 'Match already completed' });
    }

    // Get teams and players
    const teamA = await Team.findOne({ name: match.teamA });
    const teamB = await Team.findOne({ name: match.teamB });

    if (!teamA || !teamB) {
      return res.status(404).json({ error: 'Teams not found' });
    }

    const playersA = await Player.find({ teamId: teamA._id });
    const playersB = await Player.find({ teamId: teamB._id });

    // Get tournament
    const tournament = await Tournament.findById(match.tournamentId);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    // Simulate match
    const simulation = await simulateMatch(match, teamA, teamB, playersA, playersB, tournament);

    // Update match
    match.scoreA = simulation.scoreA;
    match.scoreB = simulation.scoreB;
    match.winner = simulation.winner;
    match.goals = simulation.goals;
    match.commentary = simulation.commentary;
    match.playByPlay = simulation.playByPlay;
    match.status = 'completed';
    match.matchType = 'simulated';
    match.completedAt = Date.now();

    await match.save();

    // Create goal scorer documents
    for (const goal of simulation.goals) {
      const player = goal.teamName === match.teamA
        ? playersA.find(p => p.name === goal.playerName)
        : playersB.find(p => p.name === goal.playerName);

      if (player) {
        const goalScorer = new GoalScorer({
          matchId: match._id,
          tournamentId: tournament._id,
          playerId: player._id,
          playerName: goal.playerName,
          teamId: goal.teamName === match.teamA ? teamA._id : teamB._id,
          teamName: goal.teamName,
          minute: goal.minute,
          isPenalty: goal.isPenalty,
          isOwnGoal: false
        });
        await goalScorer.save();
      }
    }

    // notify federations (emails) if available
    try {
      const homeTeamDoc = await Team.findOne({ name: match.teamA });
      const awayTeamDoc = await Team.findOne({ name: match.teamB });
      const goalsForEmail = simulation.goals.map((g: any) => ({ playerName: g.playerName, teamName: g.teamName, minute: g.minute }));
      const summary = { home: match.teamA, away: match.teamB, scoreA: simulation.scoreA, scoreB: simulation.scoreB, goals: goalsForEmail };
      const recipients: string[] = [];
      if (homeTeamDoc && (homeTeamDoc as any).repEmail) recipients.push((homeTeamDoc as any).repEmail);
      if (awayTeamDoc && (awayTeamDoc as any).repEmail) recipients.push((awayTeamDoc as any).repEmail);
      if (recipients.length > 0) {
        await sendMatchResultEmail(recipients, summary, (await Tournament.findById(match.tournamentId))?.name);
      }
    } catch (emailErr) {
      console.warn('Failed to send match notification emails:', emailErr);
    }

    res.json({
      match,
      goalScorers: simulation.goals.length,
      message: 'Match simulated successfully'
    });

  } catch (error) {
    console.error('Simulation error:', error);
    res.status(500).json({
      error: 'Failed to simulate match',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});
// Simulate all pending matches for a tournament (round)
router.post('/round/:tournamentId', async (req: Request, res: Response) => {
  try {
    const { tournamentId } = req.params;

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    // Find pending matches for this tournament
    const pendingMatches = await Match.find({ tournamentId: tournament._id, status: 'pending' }).sort({ matchNumber: 1 });

    const results: any[] = [];

    for (const m of pendingMatches) {
      // Load teams and players
      const teamA = await Team.findOne({ name: m.teamA });
      const teamB = await Team.findOne({ name: m.teamB });
      if (!teamA || !teamB) {
        results.push({ matchId: m._id, error: 'Teams not found' });
        continue;
      }
      const playersA = await Player.find({ teamId: teamA._id });
      const playersB = await Player.find({ teamId: teamB._id });

      const simulation = await simulateMatch(m, teamA, teamB, playersA, playersB, tournament);

      m.scoreA = simulation.scoreA;
      m.scoreB = simulation.scoreB;
      m.winner = simulation.winner;
      m.goals = simulation.goals;
      m.commentary = simulation.commentary;
      m.playByPlay = simulation.playByPlay;
      m.status = 'completed';
      m.matchType = 'simulated';
      m.completedAt = Date.now();

      await m.save();

      // create GoalScorer docs
      for (const goal of simulation.goals) {
        const player = goal.teamName === m.teamA
          ? playersA.find(p => p.name === goal.playerName)
          : playersB.find(p => p.name === goal.playerName);

        if (player) {
          const goalScorer = new GoalScorer({
            matchId: m._id,
            tournamentId: tournament._id,
            playerId: player._id,
            playerName: goal.playerName,
            teamId: goal.teamName === m.teamA ? teamA._id : teamB._id,
            teamName: goal.teamName,
            minute: goal.minute,
            isPenalty: goal.isPenalty,
            isOwnGoal: false
          });
          await goalScorer.save();
        }
      }

      results.push({ matchId: m._id, scoreA: m.scoreA, scoreB: m.scoreB, goals: simulation.goals.length });
    }

    res.json({ tournamentId: tournament._id, results });
  } catch (error) {
    console.error('Simulate round error:', error);
    res.status(500).json({ error: 'Failed to simulate round', details: error instanceof Error ? error.message : String(error) });
  }
});

async function simulateMatch(
  match: any,
  teamA: any,
  teamB: any,
  playersA: any[],
  playersB: any[],
  tournament: any
) {
  const homeTeam = { name: match.teamA, score: 0 };
  const awayTeam = { name: match.teamB, score: 0 };

  // Generate kickoff commentary
  const kickoffCommentary = await generateCommentary('kickoff', homeTeam, awayTeam, 0);

  const goals: any[] = [];
  const playByPlay: string[] = [kickoffCommentary];

  // Simulate goals throughout the match
  const totalGoals = Math.random() < 0.3 ? 0 : Math.floor(Math.random() * 6) + 1; // 0-6 goals

  for (let i = 0; i < totalGoals; i++) {
    const minute = Math.floor(Math.random() * 90) + 1;
    const isPenalty = Math.random() < 0.1; // 10% chance of penalty

    // Determine which team scores
    const scoringTeam = Math.random() < 0.5 ? 'A' : 'B';
    const team = scoringTeam === 'A' ? teamA : teamB;
    const players = scoringTeam === 'A' ? playersA : playersB;
    const opponentTeam = scoringTeam === 'A' ? awayTeam : homeTeam;

    // Select a random attacking player
    const attackingPlayers = players.filter(p => p.naturalPosition === 'AT' || p.naturalPosition === 'MD');
    const scorer = attackingPlayers[Math.floor(Math.random() * attackingPlayers.length)];

    if (scorer) {
      // Update score
      if (scoringTeam === 'A') {
        homeTeam.score++;
      } else {
        awayTeam.score++;
      }

      // Add goal
      goals.push({
        playerName: scorer.name,
        playerId: scorer._id,
        teamName: team.name,
        minute,
        isPenalty
      });

      // Generate goal commentary
      const goalCommentary = await generateCommentary('goal', homeTeam, awayTeam, minute);
      playByPlay.push(goalCommentary);
    }
  }

  // Generate halftime commentary if there were goals
  if (goals.length > 0 && Math.random() < 0.7) {
    const halftimeCommentary = await generateCommentary('halftime', homeTeam, awayTeam, 45);
    playByPlay.push(halftimeCommentary);
  }

  // Generate fulltime commentary
  const fulltimeCommentary = await generateCommentary('fulltime', homeTeam, awayTeam, 90);
  playByPlay.push(fulltimeCommentary);

  // Determine winner
  let winner;
  if (homeTeam.score > awayTeam.score) {
    winner = match.teamA;
  } else if (awayTeam.score > homeTeam.score) {
    winner = match.teamB;
  } else {
    winner = 'Draw';
  }

  return {
    scoreA: homeTeam.score,
    scoreB: awayTeam.score,
    winner,
    goals,
    commentary: fulltimeCommentary,
    playByPlay
  };
}

export default router;