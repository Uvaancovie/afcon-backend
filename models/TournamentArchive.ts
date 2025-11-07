import mongoose, { Schema, Document } from 'mongoose';

export interface ITournamentArchive extends Document {
  tournamentId: string;
  tournamentName: string;
  winner: string;
  runnerUp: string;
  completedAt: number;
  matches: Array<{
    stage: string;
    matchNumber: number;
    teamA: string;
    teamB: string;
    scoreA: number;
    scoreB: number;
    winner: string;
  }>;
  teams: string[];
}

const TournamentArchiveSchema: Schema = new Schema({
  tournamentId: { type: String, required: true, unique: true },
  tournamentName: { type: String, required: true },
  winner: { type: String, required: true },
  runnerUp: { type: String, required: true },
  completedAt: { type: Number, required: true },
  matches: [{
    stage: String,
    matchNumber: Number,
    teamA: String,
    teamB: String,
    scoreA: Number,
    scoreB: Number,
    winner: String
  }],
  teams: [{ type: String }]
});

export default mongoose.model<ITournamentArchive>('TournamentArchive', TournamentArchiveSchema);
