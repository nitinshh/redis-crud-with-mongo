const redis = require("redis");
const User = require("../models/User");

// Redis client setup (for Redis v4+)
const redisClient = redis.createClient();

// Handle Redis connection errors
redisClient.on("error", (err) => {
  console.log("Redis error: ", err);
});

// Ensure the Redis client connects properly
(async () => {
  try {
    await redisClient.connect(); // Connect the client
    console.log("Connected to Redis...");
  } catch (error) {
    console.error("Failed to connect to Redis", error);
  }
})();

module.exports = {
  createUser: async (req, res) => {
    try {
      const { id, name, email } = req.body;

      console.log(
        `Creating user with ID: ${id}, Name: ${name}, Email: ${email}`
      ); // Log inputs
      console.log("Raw request body:", req.body); // Log the entire request body for debugging

      // Store user info in Redis
      await redisClient.hSet(`user:${id}`, "name", name);
      await redisClient.hSet(`user:${id}`, "email", email);

      // Store user info in MongoDB
      const user = new User({ id, name, email });
      await user.save();

      // Fetch and log the user info from Redis
      const storedUser = await redisClient.hGetAll(`user:${id}`);
      console.log(`User stored in Redis:`, storedUser); // Log what's stored

      // Respond with the user details
      res
        .status(201)
        .json({ message: "User created", user: { id, name, email } });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Error creating user", error });
    }
  },

  getUser: async (req, res) => {
    try {
      const { id } = req.params;

      const user = await redisClient.hGetAll(`user:${id}`);
      if (Object.keys(user).length > 0) {
        const { name, email } = user;
        res.status(200).json({ id, name, email });
      } else {
        // If not found in Redis, check MongoDB
        const mongoUser = await User.findOne({ id });
        if (mongoUser) {
          // Cache the user data in Redis for future requests
          await redisClient.hSet(`user:${id}`, "name", mongoUser.name);
          await redisClient.hSet(`user:${id}`, "email", mongoUser.email);
          res
            .status(200)
            .json({
              id: mongoUser.id,
              name: mongoUser.name,
              email: mongoUser.email,
            });
        } else {
          res.status(404).json({ message: "User not found" });
        }
      }
    } catch (error) {
      res.status(500).json({ message: "Error fetching user", error });
    }
  },

  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email } = req.body;

      // Update in Redis
      // Update in Redis
      await redisClient.hSet(`user:${id}`, "name", name);
      await redisClient.hSet(`user:${id}`, "email", email);

      // Update in MongoDB
      await User.updateOne({ id }, { name, email });
      res
        .status(200)
        .json({ message: "User updated", user: { id, name, email } });
    } catch (error) {
      res.status(500).json({ message: "Error updating user", error });
    }
  },

  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;
      // Delete from Redis
      await redisClient.del(`user:${id}`);

      // Delete from MongoDB
      await User.deleteOne({ id });
      res.status(200).json({ message: "User deleted" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting user", error });
    }
  },
};
