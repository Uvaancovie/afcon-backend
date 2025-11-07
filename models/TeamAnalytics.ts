import mongoose, { Schema, Document } from 'mongoose';

export interface ITeamAnalytics extends Document {
  teamName: string;
  repEmail: string;
  totalTournaments: number;
  wins: number;
  losses: number;
  goalsScored: number;
  goalsConceded: number;
  championshipWins: number;
  runnerUpFinishes: number;
  lastUpdated: number;
}

const TeamAnalyticsSchema: Schema = new Schema({
  teamName: { type: String, required: true, unique: true },
  repEmail: { type: String, required: true },
  totalTournaments: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  goalsScored: { type: Number, default: 0 },
  goalsConceded: { type: Number, default: 0 },
  championshipWins: { type: Number, default: 0 },
  runnerUpFinishes: { type: Number, default: 0 },
  lastUpdated: { type: Number, default: Date.now }
});

export default mongoose.model<ITeamAnalytics>('TeamAnalytics', TeamAnalyticsSchema);
