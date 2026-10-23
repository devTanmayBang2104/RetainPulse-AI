const mongoose = require("mongoose");

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI;
  const localUri = "mongodb://127.0.0.1:27017/retainpulse";

  if (primaryUri && primaryUri.includes("mongodb+srv")) {
    try {
      const conn = await mongoose.connect(primaryUri, { serverSelectionTimeoutMS: 3000 });
      console.log(`✅ MongoDB Connected (Cloud Atlas): ${conn.connection.host}`);
      return;
    } catch (err) {
      console.warn(`⚠️ Cloud Atlas unavailable (${err.message}). Falling back to local MongoDB...`);
    }
  }

  try {
    const conn = await mongoose.connect(localUri, { serverSelectionTimeoutMS: 5000 });
    console.log(`✅ MongoDB Connected (Local Database): ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
