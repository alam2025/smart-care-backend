// auth.controller.mjs
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { prisma } from "../../config/prismaClient.mjs";

dotenv.config();

const JWT_EXPIRES = "2d";
const SALT_ROUNDS = 10;

// Role constants (DB values)
const ROLE = { USER: 1, DOCTOR: 2 };
const roleNameFromInt = (n) => (n === ROLE.DOCTOR ? "DOCTOR" : "USER");

const generateToken = (user) => {
  // include id, uuid, numeric role and roleName
  return jwt.sign(
    {
      userId: user.id,
      uuid: user.uuid,
      role: user.role,
      roleName: roleNameFromInt(user.role),
    },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
};

const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, ...rest } = user;
  return {
    ...rest,
    roleName: roleNameFromInt(rest.role),
  };
};

// SIGNUP
export const signUp = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      phoneCode,
      password,
      role = "USER",    // can be "USER"/"DOCTOR" or 1/2
      bmdcNumber,
    } = req.body;

    // Basic validation
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
        .json({ success: false, message: "Required fields missing" });
    }

    // Normalize role into numeric roleNumber (1 or 2)
    let roleNumber;
    if (typeof role === "number") {
      roleNumber = role === ROLE.DOCTOR ? ROLE.DOCTOR : ROLE.USER;
    } else {
      const r = String(role).toUpperCase();
      roleNumber = r === "DOCTOR" ? ROLE.DOCTOR : ROLE.USER;
    }

    // If doctor ensure BMDC provided
    if (roleNumber === ROLE.DOCTOR && !bmdcNumber) {
      return res
        .status(400)
        .json({ success: false, message: "BMDC number is required for doctors" });
    }

    // Check email uniqueness
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "Email already registered" });
    }

    // Check bmdc uniqueness if provided
    if (bmdcNumber) {
      const existingBmdc = await prisma.user.findUnique({
        where: { bmdcNumber },
      });
      if (existingBmdc) {
        return res
          .status(400)
          .json({ success: false, message: "BMDC number already registered" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const created = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phoneNumber,
        phoneCode,
        password: hashedPassword,
        role: roleNumber,
        bmdcNumber: bmdcNumber ?? null,
        // isDoctorVerified/isVerified default to false
      },
    });

    const token = generateToken(created);

    return res.status(201).json({
      success: true,
      message: `${roleNameFromInt(roleNumber)} registered successfully`,
      token,
      data: sanitizeUser(created),
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
    if (!user)
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      data: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// -----------------------

// import bcrypt from "bcrypt";
// import jwt from "jsonwebtoken";
// import dotenv from "dotenv";
// import { prisma } from "../../config/prismaClient.mjs";

// dotenv.config();

// const generateToken = (userId, role) => {
//   return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
//     expiresIn: "2d",
//   });
// };

// export const signUp = async (req, res, next) => {
//   try {
//     const {
//       role,
//       firstName,
//       lastName,
//       email,
//       phoneNumber,
//       phoneCode,
//       password,
//       specialization,
//       licenseNumber,
//     } = req.body;

//     if (
//       !role ||
//       !firstName ||
//       !lastName ||
//       !email ||
//       !phoneNumber ||
//       !phoneCode ||
//       !password
//     ) {
//       return res
//         .status(400)
//         .json({
//           success: false,
//           message: "All required fields must be provided",
//         });
//     }

//     if (role !== "user" && role !== "doctor") {
//       return res
//         .status(400)
//         .json({
//           success: false,
//           message: "Role must be either 'user' or 'doctor'",
//         });
//     }

//     // Check if email exists in the respective model
//     let existing;
//     if (role === "user") {
//       existing = await prisma.user.findUnique({ where: { email } });
//     } else {
//       existing = await prisma.doctor.findUnique({ where: { email } });
//     }

//     if (existing) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Email already registered" });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     let newRecord;
//     if (role === "user") {
//       newRecord = await prisma.user.create({
//         data: {
//           firstName,
//           lastName,
//           email,
//           phoneNumber,
//           phoneCode,
//           password: hashedPassword,
//         },
//       });
//     } else {
//       if (!specialization || !licenseNumber) {
//         return res
//           .status(400)
//           .json({
//             success: false,
//             message: "Doctor specialization and license number required",
//           });
//       }

//       // Check licenseNumber unique
//       const licenseExists = await prisma.doctor.findUnique({
//         where: { licenseNumber },
//       });
//       if (licenseExists) {
//         return res
//           .status(400)
//           .json({
//             success: false,
//             message: "License number already registered",
//           });
//       }

//       newRecord = await prisma.doctor.create({
//         data: {
//           firstName,
//           lastName,
//           email,
//           phoneNumber,
//           phoneCode,
//           password: hashedPassword,
//           specialization,
//           licenseNumber,
//         },
//       });
//     }

//     const token = generateToken(newRecord.id, role);

//     res.status(201).json({
//       success: true,
//       message: `${
//         role.charAt(0).toUpperCase() + role.slice(1)
//       } registered successfully`,
//       token,
//       data: { ...newRecord, password: undefined },
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// export const login = async (req, res, next) => {
//   try {
//     const { role, email, password } = req.body;

//     if (!role || !email || !password) {
//       return res
//         .status(400)
//         .json({
//           success: false,
//           message: "Role, email and password are required",
//         });
//     }

//     if (role !== "user" && role !== "doctor") {
//       return res
//         .status(400)
//         .json({
//           success: false,
//           message: "Role must be either 'user' or 'doctor'",
//         });
//     }

//     let user;
//     if (role === "user") {
//       user = await prisma.user.findUnique({ where: { email } });
//     } else {
//       user = await prisma.doctor.findUnique({ where: { email } });
//     }

//     if (!user) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid credentials" });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid credentials" });
//     }

//     const token = generateToken(user.id, role);

//     res.status(200).json({
//       success: true,
//       message: "Login successful",
//       token,
//       data: { ...user, password: undefined },
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// ------------------------------------------------------------
// auth.controller.mjs
// import bcrypt from "bcrypt";
// import jwt from "jsonwebtoken";
// import dotenv from "dotenv";
// import { prisma } from "../../config/prismaClient.mjs";

// dotenv.config();

// // Helper: generate JWT token
// const generateToken = (userId) => {
//   return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "2d" });
// };

// // SIGNUP
// export const signUp = async (req, res, next) => {
//   try {
//     const { firstName, lastName, email, phoneNumber, phoneCode, password } =
//       req.body;

//     if (
//       !firstName ||
//       !lastName ||
//       !email ||
//       !phoneNumber ||
//       !phoneCode ||
//       !password
//     ) {
//       return res
//         .status(400)
//         .json({ success: false, message: "All fields are required" });
//     }

//     const existingUser = await prisma.user.findUnique({ where: { email } });
//     if (existingUser) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Email already registered" });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const newUser = await prisma.user.create({
//       data: {
//         firstName,
//         lastName,
//         email,
//         phoneNumber,
//         phoneCode,
//         password: hashedPassword,
//       },
//     });

//     const token = generateToken(newUser.id);

//     res.status(201).json({
//       success: true,
//       message: "User registered successfully",
//       token,
//       data: { ...newUser, password: undefined },
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// // LOGIN
// export const login = async (req, res, next) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Email and password are required" });
//     }

//     const user = await prisma.user.findUnique({ where: { email } });
//     if (!user) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid credentials" });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid credentials" });
//     }

//     const token = generateToken(user.id);

//     res.status(200).json({
//       success: true,
//       message: "Login successful",
//       token,
//       data: { ...user, password: undefined },
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// ----------------------------------------------

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
