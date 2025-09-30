import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name?: string;
  email: string;
  image?: string;
  provider?: string;
  providerId?: string;
  user_role: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true },
    image: { type: String },
    provider: { type: String },
    providerId: { type: String },
    user_role: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);