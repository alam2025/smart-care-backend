import { v4 as uuidv4 } from "uuid";
import pool from "../../config/db.mjs";

export const createDonor = async (req, res, next) => {
  try {
    const { name, mobile, email, blood, address, total_donate } = req.body;

    const [rows] = await pool.query(`SELECT * FROM users WHERE email=?`, [
      email,
    ]);

    if (rows.length > 0) {
      return next({
        statusCode: 400,
        message: "Donor already exist!",
      });
    }

    const sql = `INSERT INTO donors (uuid, name, email, mobile, blood, total_donate, address) values(?, ?, ?, ?, ?,?,?)`;

    await pool.query(sql, [
      uuidv4(),
      name,
      email,
      mobile,
      blood,
      total_donate,
      address,
    ]);

    res.status(201).json({
      success: true,
      message: "Successfully added new donor",
    });
  } catch (err) {
    next(err);
  }
};

export const editDonor = async (req, res, next) => {
  try {
    const uuid = req.params.uuid;
    const { name, mobile, email, blood, address, total_donate } = req.body;

    const sql = `
    UPDATE donors 
    SET 
      name = ?, 
      email = ?, 
      mobile = ?, 
      blood = ?, 
      total_donate = ?, 
      address = ? 
    WHERE uuid = ?
  `;

    await pool.query(sql, [
      name,
      email,
      mobile,
      blood,
      total_donate,
      address,
      uuid, // The UUID of the record to update
    ]);

    res.status(201).json({
      success: true,
      message: "Successfully update donor",
    });
  } catch (err) {
    next(err);
  }
};

export const getAllDonors = async (req, res, next) => {
  try {
    const sql = `SELECT * FROM donors ORDER BY id DESC`;

    const [donors] = await pool.query(sql);

    res.status(200).json({
      success: true,
      message: "Successfully get all donors",
      data: {
        donors: donors,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getSingleDonor = async (req, res, next) => {
  try {
    const uuid = req.params.uuid;

    const sql = `select * from donors where uuid=?`;

    const [donor] = await pool.query(sql, [uuid]);

    res.status(200).json({
      success: true,
      message: "Successfully get donor",
      data: {
        donor: donor[0],
      },
    });
  } catch (err) {
    next(err);
  }
};

export const deleteDonor = async (req, res, next) => {
  try {
    const { uuid } = req.params;

    const sql = `DELETE FROM donors where uuid=?`;
    await pool.query(sql, [uuid]);

    res.status(200).json({
      success: true,
      message: "Successfully deleted donor",
    });
  } catch (err) {
    next(err);
  }
};
