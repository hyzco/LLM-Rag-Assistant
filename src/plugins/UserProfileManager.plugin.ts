// // UserProfileManager.ts
// import CassandraVectorDatabase from "../database/CassandraVectorDatabase.js";

// interface UserProfile {
//   userId: string;
//   preferences: Record<string, any>;
//   history: string[];
//   context: Record<string, any>;
// }

// export default class UserProfileManager {
//   private db: CassandraVectorDatabase;

//   constructor(db: CassandraVectorDatabase) {
//     this.db = db;
//   }

//   /**
//    * Create a new user profile.
//    * @param userId Unique user ID
//    * @param initialData Initial data for the user profile
//    * @returns Promise<UserProfile> Created user profile
//    */
//   public async createUserProfile(userId: string, initialData: Partial<UserProfile>): Promise<UserProfile> {
//     const newUserProfile: UserProfile = {
//       userId,
//       preferences: initialData.preferences || {},
//       history: initialData.history || [],
//       context: initialData.context || {},
//     };
//     await this.db.insertUserProfile(newUserProfile);
//     return newUserProfile;
//   }

//   /**
//    * Retrieve an existing user profile.
//    * @param userId Unique user ID
//    * @returns Promise<UserProfile | null> User profile or null if not found
//    */
//   public async getUserProfile(userId: string): Promise<UserProfile | null> {
//     return this.db.getUserProfile(userId);
//   }

//   /**
//    * Update a user profile with new information.
//    * @param userId Unique user ID
//    * @param updatedData Data to update in the user profile
//    * @returns Promise<UserProfile | null> Updated user profile or null if not found
//    */
//   public async updateUserProfile(userId: string, updatedData: Partial<UserProfile>): Promise<UserProfile | null> {
//     const existingProfile = await this.getUserProfile(userId);
//     if (!existingProfile) {
//       return null;
//     }
//     const updatedProfile: UserProfile = {
//       ...existingProfile,
//       ...updatedData,
//     };
//     await this.db.updateUserProfile(updatedProfile);
//     return updatedProfile;
//   }

//   /**
//    * Delete a user profile.
//    * @param userId Unique user ID
//    * @returns Promise<boolean> True if deletion was successful, false otherwise
//    */
//   public async deleteUserProfile(userId: string): Promise<boolean> {
//     return this.db.deleteUserProfile(userId);
//   }

//   /**
//    * Retrieve the context for a specific user.
//    * @param userId Unique user ID
//    * @returns Promise<Record<string, any>> User context
//    */
//   public async getUserContext(userId: string): Promise<Record<string, any>> {
//     const profile = await this.getUserProfile(userId);
//     return profile ? profile.context : {};
//   }
// }
