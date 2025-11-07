import mongoose, { Schema, Document } from 'mongoose';

export interface ITournament extends Document {
  name: string;
  stage: 'not_started' | 'quarter_finals' | 'semi_finals' | 'final' | 'completed';
  status: 'pending' | 'active' | 'completed';
  currentMatchIndex: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

const TournamentSchema: Schema = new Schema({
  name: { type: String, required: true },
  stage: { 
    type: String, 
    required: true,
    enum: ['not_started', 'quarter_finals', 'semi_finals', 'final', 'completed'],
    default: 'not_started'
  },
  status: { 
    type: String, 
    required: true,
    enum: ['pending', 'active', 'completed'],
    default: 'pending'
  },
  currentMatchIndex: { type: Number, default: 0 },
  createdAt: { type: Number, default: Date.now },
  startedAt: { type: Number },
  completedAt: { type: Number }
});

export default mongoose.model<ITournament>('Tournament', TournamentSchema);
