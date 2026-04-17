import axios from "axios";
import { pool } from "../config/db.js";
import { getAgeGroup } from "../utils/helpers.js";
import { profileSchema } from "../utils/validator.js";
import { v4 as uuidv4 } from "uuid";

// CREATE PROFILE
export const createProfile = async (req, res, next) => {
  try {
    // VALIDATE INPUT
    const { error } = profileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: "error",
        message: error.details[0].message,
      });
    }

    const { name } = req.body;

    // CHECK CACHE
    const existing = await pool.query(
      "SELECT * FROM profiles WHERE LOWER(name) = LOWER($1)",
      [name]
    );

    if (existing.rows.length > 0) {
      return res.json({
        status: "success",
        source: "cache",
        data: existing.rows[0],
      });
    }

    // CALL APIs
    const [genderRes, ageRes, nationRes] = await Promise.all([
      axios.get(`https://api.genderize.io?name=${name}`),
      axios.get(`https://api.agify.io?name=${name}`),
      axios.get(`https://api.nationalize.io?name=${name}`),
    ]);

    // VALIDATION
    if (!genderRes.data.gender || genderRes.data.count === 0) {
      return res.status(502).json({
        status: "error",
        message: "Invalid gender data",
      });
    }

    if (!ageRes.data.age) {
      return res.status(502).json({
        status: "error",
        message: "Invalid age data",
      });
    }

    if (!nationRes.data.country.length) {
      return res.status(502).json({
        status: "error",
        message: "Invalid nationality data",
      });
    }

    const topCountry = nationRes.data.country.reduce((a, b) =>
      a.probability > b.probability ? a : b
    );

    const profile = {
      id: uuidv4(),
      name,
      gender: genderRes.data.gender,
      gender_probability: genderRes.data.probability,
      sample_size: genderRes.data.count,
      age: ageRes.data.age,
      age_group: getAgeGroup(ageRes.data.age),
      country_id: topCountry.country_id,
      country_probability: topCountry.probability,
      created_at: new Date(),
    };

    await pool.query(
      `INSERT INTO profiles 
      (id, name, gender, gender_probability, sample_size, age, age_group, country_id, country_probability, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      Object.values(profile)
    );

    return res.status(201).json({
      status: "success",
      source: "api",
      data: profile,
    });

  } catch (error) {
    console.error("CREATE PROFILE ERROR:", error.message);
    next(error);
  }
};

// GET ALL (WITH PAGINATION + FILTER + SORT)
export const getProfiles = async (req, res, next) => {
  try {
    let query = "SELECT * FROM profiles WHERE 1=1";
    const values = [];

    if (req.query.gender) {
      values.push(req.query.gender.toLowerCase());
      query += ` AND LOWER(gender) = $${values.length}`;
    }

    if (req.query.country_id) {
      values.push(req.query.country_id.toUpperCase());
      query += ` AND country_id = $${values.length}`;
    }

    if (req.query.age_group) {
      values.push(req.query.age_group.toLowerCase());
      query += ` AND LOWER(age_group) = $${values.length}`;
    }

    // SORTING
    const allowedSort = ["name", "age", "created_at"];
    if (req.query.sort_by && allowedSort.includes(req.query.sort_by)) {
      query += ` ORDER BY ${req.query.sort_by}`;
    }

    // PAGINATION
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    values.push(limit, offset);
    query += ` LIMIT $${values.length - 1} OFFSET $${values.length}`;

    const result = await pool.query(query, values);

    res.json({
      status: "success",
      count: result.rows.length,
      data: result.rows,
    });

  } catch (error) {
    console.error("GET PROFILES ERROR:", error.message);
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

    res.json({
      status: "success",
      data: result.rows[0],
    });

  } catch (error) {
    next(error);
  }
};

// DELETE
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

    res.status(204).send();

  } catch (error) {
    next(error);
  }
};