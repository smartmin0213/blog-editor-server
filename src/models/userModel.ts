import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";
import { BlogSchemaInterface } from "./blogModel";

export interface UserSchemaInterface extends Document {
  name: string;
  email: string;
  password: string;
  matchPassword(candidatePassword: string): Promise<boolean>;
  blogs: Array<BlogSchemaInterface>;
}

const userSchema = new Schema<UserSchemaInterface>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    blogs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Blog",
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {  
        delete ret.__v;
        delete ret.password;
        return ret;
      },
    },
  }
);

userSchema.pre<UserSchemaInterface>("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(this.password, salt);
  this.password = hashedPassword;
  next();
});

userSchema.methods.matchPassword = async function (candidatePassword: string) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model<UserSchemaInterface>("User", userSchema);

export default User;
