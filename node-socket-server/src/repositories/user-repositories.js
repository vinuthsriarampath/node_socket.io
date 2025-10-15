import { User } from "../models/user-model.js"

// Find user by email
export const findByEmail = async (email) => {
    return User.findOne({ email });
  };
  
  // Find by provider
  export const findByProvider = async (provider, providerId) => {
    return User.findOne({ 'providers.provider': provider, 'providers.providerId': providerId });
  };
  
  // Create user
  export const create = async (userData) => {
    const user = new User(userData);
    return user.save();
  };
  
  // Add provider to user
  export const addProvider = async (userId, provider, providerId) => {
    try {
      // First, check if the provider already exists
      const existingUser = await User.findOne({
        _id: userId,
        'providers.provider': provider
      });

      if (existingUser) {
        // Provider exists, update the providerId
        const result = await User.updateOne(
          { _id: userId, 'providers.provider': provider },
          { $set: { 'providers.$.providerId': providerId } }
        );
      } else {
        // Provider doesn't exist, add it
        const result = await User.updateOne(
          { _id: userId },
          { $push: { providers: { provider, providerId } } }
        );
      }

      // Return the updated user
      return await User.findById(userId);
    } catch (error) {
      throw error;
    }
  };
  
  // Update user
  export const update = async (userId, updates) => {
    return User.updateOne({ _id: userId }, { $set: updates });
  };
  
  // Find user by id
  export const findById = async (userId) => {
    return User.findById(userId);
  }