import * as userRepo from '../repositories/user-repositories.js';
import bcrypt from 'bcryptjs';
import { UserDto } from "../dtos/user-Dto.js";
import { ApiError } from "../exceptions/api-error.js";

// Register manual user
export const register = async (userData) => {
  // Check if email exists (prevent duplicates)
  const existingUser = await userRepo.findByEmail(userData.email);
  if (existingUser) throw new ApiError(409, 'Email already in use');

  // Hash password (10 rounds is standard)
  userData.password = await bcrypt.hash(userData.password, 10);

  // Create user
  const user = await userRepo.create(userData);
  return new UserDto(user); // Return DTO without sensitive data
};

// Common function for social login (used in Passport callbacks)
export const handleSocialLogin = async (provider, profile) => {
  let user = await userRepo.findByProvider(provider, profile.id);

  if (!user) {
    console.log(profile);
    // Check by email (industry standard to link/merge)
    user = await userRepo.findByEmail(profile.emails[0].value);
    if (user) {
      // Link provider to existing account
      await userRepo.addProvider(user._id, provider, profile.id);

      // Prepare only the updates you want
      const updates = {
        firstName: user.firstName || profile.name.givenName,
        lastName: user.lastName || profile.name.familyName,
      };

      await userRepo.update(user._id, updates);

      // Refresh user from DB
      user = await userRepo.findById(user._id);

    } else {
      console.log(profile);
      // Handle GitHub and Google profile differences
      let email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
      let firstName = null;
      let lastName = null;

      if (profile.provider === 'github') {
        // GitHub: no name.givenName/familyName, use displayName or username
        if (profile.displayName) {
          // Try to split displayName into first/last
          const nameParts = profile.displayName.split(' ');
          firstName = nameParts[0];
          lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
        } else if (profile.username) {
          firstName = profile.username;
          lastName = '';
        }
      } else if (profile.provider === 'google') {
        // Google: has name.givenName/familyName
        firstName = profile.name?.givenName || '';
        lastName = profile.name?.familyName || '';
      } else if(provider === 'facebook'){
        console.log(profile);
      }

      user = await userRepo.create({
        email,
        firstName,
        lastName,
        providers: [{ provider, providerId: profile.id }]
      });
    }
  }
  return user;
};