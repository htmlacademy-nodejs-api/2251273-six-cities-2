import { Document, model, Model, Schema, Types } from 'mongoose';
import { generateId } from '../../helpers/index.js';
import { UserInterface } from './user.interface.js';

export type DocumentUser = UserInterface &
  Document & {
    _id: Types.ObjectId;
  };

const userSchema: Schema<DocumentUser> = new Schema<DocumentUser>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      default: () => generateId(),
    },

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 50,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    avatarUrl: {
      type: String,
      trim: true,
      default: '',
    },

    type: {
      type: String,
      required: true,
      enum: ['regular', 'pro'],
      default: 'regular',
    },
    favorites: {
      type: [String],
      default: [],
    },
  },
  {
    id: false,
    timestamps: true,
    collection: 'users',
    autoIndex: false,
    toJSON: {
      transform: (_doc, ret) => {
        const result = ret as Record<string, unknown>;

        delete result.password;
        delete result._id;
        delete result.__v;

        return result;
      },
    },
  },
);

export const UserModel: Model<DocumentUser> = model<DocumentUser>(
  'User',
  userSchema,
);
