import mongoose, { Schema, Document } from 'mongoose';

export interface IMatch extends Document {
  tournamentId: string;
  stage: 'quarter_finals' | 'semi_finals' | 'final';
  matchNumber: number;
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  winner?: string;
  commentary?: string;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: number;
  completedAt?: number;
}

const MatchSchema: Schema = new Schema({
  tournamentId: { type: String, required: true, index: true },
  stage: { 
    type: String, 
    required: true,
    enum: ['quarter_finals', 'semi_finals', 'final']
  },
  matchNumber: { type: Number, required: true },
  teamA: { type: String, required: true },
  teamB: { type: String, required: true },
  scoreA: { type: Number, default: 0 },
  scoreB: { type: Number, default: 0 },
  winner: { type: String },
  commentary: { type: String },
  status: { 
    type: String, 
    required: true,
    enum: ['pending', 'in_progress', 'completed'],
    default: 'pending'
  },
  createdAt: { type: Number, default: Date.now },
  completedAt: { type: Number }
});

export default mongoose.model<IMatch>('Match', MatchSchema);
