import axios from "axios";
import { pool } from "../config/db.js";
import { getAgeGroup } from "../utils/helpers.js";
import { v4 as uuidv4 } from "uuid";

// CREATE PROFILE
export const createProfile = async (req, res, next) => {
  try {
    let { name } = req.body;

    // VALIDATION
    if (!name || typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({
        status: "error",
        message: "Name is required",
      });
    }

    if (!isNaN(name)) {
      return res.status(422).json({
        status: "error",
        message: "Name must be a valid string",
      });
    }

    const cleanName = name.trim().toLowerCase();

    // IDEMPOTENCY
    const existing = await pool.query(
      "SELECT * FROM profiles WHERE LOWER(name) = $1",
      [cleanName]
    );

    if (existing.rows.length > 0) {
      return res.status(200).json({
        status: "success",
        data: existing.rows[0],
      });
    }

    // EXTERNAL APIs
    const [genderRes, ageRes, nationRes] = await Promise.all([
      axios.get(`https://api.genderize.io?name=${cleanName}`),
      axios.get(`https://api.agify.io?name=${cleanName}`),
      axios.get(`https://api.nationalize.io?name=${cleanName}`),
    ]);

    if (!genderRes.data.gender) {
      return res.status(502).json({
        status: "error",
        message: "Gender API failed",
      });
    }

    if (!ageRes.data.age) {
      return res.status(502).json({
        status: "error",
        message: "Age API failed",
      });
    }

    if (!nationRes.data.country?.length) {
      return res.status(502).json({
        status: "error",
        message: "Nationality API failed",
      });
    }

    const topCountry = nationRes.data.country.reduce((a, b) =>
      a.probability > b.probability ? a : b
    );

    const profile = {
      id: uuidv4(),
      name: cleanName,
      gender: genderRes.data.gender,
      gender_probability: Number(genderRes.data.probability),
      sample_size: genderRes.data.count,
      age: ageRes.data.age,
      age_group: getAgeGroup(ageRes.data.age),
      country_id: topCountry.country_id,
      country_probability: Number(topCountry.probability),
      created_at: new Date().toISOString(),
    };

    await pool.query(
      `INSERT INTO profiles 
      (id, name, gender, gender_probability, sample_size, age, age_group, country_id, country_probability, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      Object.values(profile)
    );

    return res.status(201).json({
      status: "success",
      data: profile,
    });

  } catch (error) {
    next(error);
  }
};

// ✅ FIXED: GET ALL WITH FILTERING
export const getProfiles = async (req, res, next) => {
  try {
    let query = "SELECT * FROM profiles WHERE 1=1";
    let values = [];
    let index = 1;

    if (req.query.gender) {
      query += ` AND LOWER(gender) = LOWER($${index++})`;
      values.push(req.query.gender);
    }

    if (req.query.age_group) {
      query += ` AND age_group = $${index++}`;
      values.push(req.query.age_group);
    }

    if (req.query.country_id) {
      query += ` AND country_id = $${index++}`;
      values.push(req.query.country_id);
    }

    query += " ORDER BY created_at DESC";

    const result = await pool.query(query, values);

    return res.status(200).json({
      status: "success",
      count: result.rows.length,
      data: result.rows,
    });

  } catch (error) {
    next(error);
  }
};

// GET ONE
export const getProfile = async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT * FROM profiles WHERE id = $1",
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        status: "error",
        message: "Profile not found",
      });
    }

    return res.status(200).json({
      status: "success",
      data: result.rows[0],
    });

  } catch (error) {
    next(error);
  }
};

// ✅ FIXED: DELETE (204 NO CONTENT)
export const deleteProfile = async (req, res, next) => {
  try {
    const result = await pool.query(
      "DELETE FROM profiles WHERE id = $1 RETURNING *",
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        status: "error",
        message: "Profile not found",
      });
    }

    return res.status(204).send(); // IMPORTANT

  } catch (error) {
    next(error);
  }
};