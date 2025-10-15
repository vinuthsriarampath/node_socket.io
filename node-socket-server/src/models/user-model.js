import mongoose from "mongoose";    

const providerSchema = new mongoose.Schema({
  provider: { type: String, required: true },
  providerId: { type: String, required: true }
});

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Hashed, optional for social users
    firstName: { type: String },
    lastName: { type: String },
    dob: { type: Date },
    address: { type: String },
    phone: { type: String },
    providers: [providerSchema] // Array for multiple social providers
  }, { timestamps: true });
  
  export const User = mongoose.model('User', userSchema);