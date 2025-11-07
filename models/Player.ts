import mongoose, { Schema, Document } from 'mongoose';

export type Position = 'GK' | 'DF' | 'MD' | 'AT';

export interface IPlayerRatings {
  GK: number;
  DF: number;
  MD: number;
  AT: number;
}

export interface IPlayer extends Document {
  name: string;
  naturalPosition: Position;
  ratings: IPlayerRatings;
  teamId: mongoose.Types.ObjectId;
  isCaptain: boolean;
  nationality: string;
  jerseyNumber: number;
}

const PlayerSchema = new Schema<IPlayer>({
  name: { type: String, required: true },
  naturalPosition: { 
    type: String, 
    enum: ['GK', 'DF', 'MD', 'AT'], 
    required: true 
  },
  ratings: {
    GK: { type: Number, min: 0, max: 100, required: true },
    DF: { type: Number, min: 0, max: 100, required: true },
    MD: { type: Number, min: 0, max: 100, required: true },
    AT: { type: Number, min: 0, max: 100, required: true }
  },
  teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
  isCaptain: { type: Boolean, default: false },
  nationality: { type: String, required: true },
  jerseyNumber: { type: Number, min: 1, max: 99, required: true }
}, { timestamps: true });

// Helper function to generate ratings based on natural position
export const generateRatings = (naturalPosition: Position): IPlayerRatings => {
  const positions: Position[] = ['GK', 'DF', 'MD', 'AT'];
  const ratings = {} as IPlayerRatings;
  
  positions.forEach(pos => {
    if (pos === naturalPosition) {
      // Natural position: 50-100
      ratings[pos] = Math.floor(Math.random() * 51) + 50;
    } else {
      // Non-natural position: 0-50
      ratings[pos] = Math.floor(Math.random() * 51);
    }
  });
  
  return ratings;
};

export default mongoose.model<IPlayer>('Player', PlayerSchema);
