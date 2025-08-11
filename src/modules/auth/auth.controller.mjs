// auth.controller.mjs
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { prisma } from "../../config/prismaClient.mjs";

dotenv.config();

// Helper: generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "2d" });
};

// SIGNUP
export const signUp = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phoneNumber, phoneCode, password } =
      req.body;

    if (
      !firstName ||
      !lastName ||
      !email ||
      !phoneNumber ||
      !phoneCode ||
      !password
    ) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phoneNumber,
        phoneCode,
        password: hashedPassword,
      },
    });

    const token = generateToken(newUser.id);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      data: { ...newUser, password: undefined },
    });
  } catch (error) {
    next(error);
  }
};

// LOGIN
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken(user.id);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      data: { ...user, password: undefined },
    });
  } catch (error) {
    next(error);
  }
};

// import { v4 as uuidv4 } from "uuid";
// import pool from "../../config/db.mjs";
// import bcrypt from "bcrypt";
// import jwt from "jsonwebtoken";
// import dotenv from "dotenv";

// dotenv.config();

// export const signUp = async (req, res, next) => {
//   try {
//     const { name, email, mobile, blood, total_donate, address, password } =
//       req.body;

//     if (!email || !name || !password) {
//       return next({
//         statusCode: 200,
//         message: "Fill required fields !!",
//       });
//     }

//     const [rows] = await pool.query(`SELECT * FROM users WHERE email=?`, [
//       email,
//     ]);

//     if (rows.length > 0) {
//       return next({
//         statusCode: 200,
//         message: "User already exist!",
//       });
//     }

//     // Hash the password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     const result = await pool.query(
//       "INSERT INTO users (uuid,name,email,mobile,password,address) values(?,?,?,?,?,?)",
//       [uuidv4(), name, email, mobile, hashedPassword, address]
//     );

//     const [existUser] = await pool.query(
//       `select * FROM donors where email =?`,
//       [email]
//     );

//     console.log(existUser);

//     if (existUser.length == 0) {
//       const donorSql = `INSERT INTO donors (uuid, name, email, mobile, blood, total_donate, address) values(?, ?, ?, ?, ?,?,?)`;

//       await pool.query(donorSql, [
//         uuidv4(),
//         name,
//         email,
//         mobile,
//         blood,
//         total_donate,
//         address,
//       ]);
//     }

//     res.status(201).json({
//       success: true,
//       message: "Successfully sign up. please login",
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// export const login = async (req, res, next) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return next({
//         statusCode: 200,
//         message: "Fill required fields !!",
//       });
//     }

//     const [rows] = await pool.query(`SELECT * FROM users WHERE email=?`, [
//       email,
//     ]);

//     if (rows.length == 0) {
//       return next({
//         statusCode: 200,
//         message: "User not found!",
//       });
//     }

//     // Compare passwords
//     const isMatch = await bcrypt.compare(password, rows[0].password);
//     if (!isMatch) {
//       return next({
//         statusCode: 200,
//         message: "Invalid password!",
//       });
//     }

//     const token = jwt.sign({ user: rows[0] }, process.env.JWT_SECRET, {
//       expiresIn: "7d",
//     });

//     const { password: _, ...user } = rows[0];

//     res.status(200).json({
//       success: true,
//       message: "Login Successful",
//       token,
//       data: { user },
//     });
//   } catch (err) {
//     next(err);
//   }
// };
