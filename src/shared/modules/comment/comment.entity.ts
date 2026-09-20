import { Document, model, Model, Schema, Types } from 'mongoose';
import { generateId } from './../../helpers/index.js';
import { CommentInterface } from './comment.interface.js';

export type DocumentComment = CommentInterface &
  Document & {
    _id: Types.ObjectId;
  };

const commentSchema: Schema<DocumentComment> = new Schema<DocumentComment>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      default: () => generateId(),
    },
    text: {
      type: String,
      required: true,
      minlength: 5,
      maxlength: 1024,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    offer: {
      type: Schema.Types.ObjectId,
      ref: 'Offer',
      required: true,
    },
  },
  {
    id: false,
    timestamps: true,
    collection: 'comments',
    toJSON: {
      transform: (_doc, ret) => {
        const result = ret as Record<string, unknown>;
        delete result._id;
        delete result.__v;
        const { id, ...rest } = result;
        return { id, ...rest };
      },
    },
  },
);

export const CommentModel: Model<DocumentComment> = model<DocumentComment>(
  'Comment',
  commentSchema,
);
