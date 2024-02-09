import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables from .env file

export const connectDB = async () => {
  try {
    console.log("db connecting...");
    const res = await mongoose.connect(process.env.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`mongodb connected with server ${res.connection.host}`);
  } catch (error) {
    console.log("mongodb connection failed!");
    console.log(error);
  }
};
// import mongoose from "mongoose";
// import 'dotenv/config';

// export const connectDB = async () => {
//   try {
//     console.log("db connecting...");
//     console.log("MongoDB URI from .env file:", process.env.mongoURI);
//     console.log(process.env.mongoURI)
//     const res = await mongoose.connect(process.env.mongoURI, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });
//     console.log(`mongodb connected with server ${res.connection.host}`);
//   } catch (error) {
//     console.log("mongodb connection failed!");
//     console.log(error);
//   }
// };
