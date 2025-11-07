import mongoose, { Schema, Document } from 'mongoose';

export interface ITeam extends Document {
  name: string;
  country: string;
  repName: string;
  repEmail: string;
  managerName: string;
  confederation: 'CAF' | 'CONCACAF' | 'CONMEBOL' | 'UEFA' | 'AFC' | 'OFC';
  rating: number;
  isSeeded: boolean;
  isEliminated: boolean;
  createdAt: number;
}

const TeamSchema: Schema = new Schema({
  name: { type: String, required: true },
  country: { type: String, required: true },
  repName: { type: String, required: true },
  repEmail: { type: String, required: true },
  managerName: { type: String, required: true },
  confederation: { 
    type: String, 
    required: true,
    enum: ['CAF', 'CONCACAF', 'CONMEBOL', 'UEFA', 'AFC', 'OFC']
  },
  rating: { type: Number, default: 0 },
  isSeeded: { type: Boolean, default: false },
  isEliminated: { type: Boolean, default: false },
  createdAt: { type: Number, default: Date.now }
});

export default mongoose.model<ITeam>('Team', TeamSchema);
