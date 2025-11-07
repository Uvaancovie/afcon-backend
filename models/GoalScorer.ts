import mongoose, { Schema, Document } from 'mongoose';

export interface IGoalScorer extends Document {
  matchId: mongoose.Types.ObjectId;
  tournamentId: mongoose.Types.ObjectId;
  playerId: mongoose.Types.ObjectId;
  playerName: string;
  teamId: mongoose.Types.ObjectId;
  teamName: string;
  minute: number;
  isPenalty: boolean;
  isOwnGoal: boolean;
}

const GoalScorerSchema = new Schema<IGoalScorer>({
  matchId: { type: Schema.Types.ObjectId, ref: 'Match', required: true },
  tournamentId: { type: Schema.Types.ObjectId, ref: 'Tournament', required: true },
  playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
  playerName: { type: String, required: true },
  teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
  teamName: { type: String, required: true },
  minute: { type: Number, required: true, min: 1, max: 120 },
  isPenalty: { type: Boolean, default: false },
  isOwnGoal: { type: Boolean, default: false }
}, { timestamps: true });

// Index for fast leaderboard queries
GoalScorerSchema.index({ tournamentId: 1, playerName: 1 });
GoalScorerSchema.index({ tournamentId: 1, teamName: 1 });

export default mongoose.model<IGoalScorer>('GoalScorer', GoalScorerSchema);
