import axios from "axios";
import { pool } from "../config/db.js";
import { getAgeGroup } from "../utils/helpers.js";
import { v4 as uuidv4 } from "uuid";

// CREATE PROFILE
export const createProfile = async (req, res, next) => {
  try {
    let { name } = req.body;

    // VALIDATION
    if (!name || typeof name !== "string") {
      return res.status(400).json({
        status: "error",
        message: "Name is required and must be a string",
      });
    }

    name = name.trim();

    if (name.length < 2) {
      return res.status(400).json({
        status: "error",
        message: "Name must be at least 2 characters",
      });
    }

    if (!isNaN(name)) {
      return res.status(422).json({
        status: "error",
        message: "Name must be a valid string",
      });
    }

    const cleanName = name.toLowerCase();

    // IDEMPOTENCY
    const existing = await pool.query(
      "SELECT * FROM profiles WHERE LOWER(name) = $1",
      [cleanName]
    );

    if (existing.rows.length > 0) {
      return res.status(200).json({
        status: "success",
        message: "Profile already exists",
        data: existing.rows[0],
      });
    }

    // API CALLS (SAFE)
    const [genderRes, ageRes, nationRes] = await Promise.allSettled([
      axios.get(`https://api.genderize.io?name=${cleanName}`),
      axios.get(`https://api.agify.io?name=${cleanName}`),
      axios.get(`https://api.nationalize.io?name=${cleanName}`),
    ]);

    const genderData = genderRes.status === "fulfilled" ? genderRes.value.data : {};
    const ageData = ageRes.status === "fulfilled" ? ageRes.value.data : {};
    const nationData = nationRes.status === "fulfilled" ? nationRes.value.data : {};

    const topCountry =
      nationData.country?.length > 0
        ? nationData.country.reduce((a, b) =>
            a.probability > b.probability ? a : b
          )
        : null;

    const profile = {
      id: uuidv4(),
      name: cleanName,
      gender: genderData.gender || "unknown",
      gender_probability: genderData.probability || 0,
      sample_size: genderData.count || 0,
      age: ageData.age || null,
      age_group: ageData.age ? getAgeGroup(ageData.age) : "unknown",
      country_id: topCountry?.country_id || "unknown",
      country_probability: topCountry?.probability || 0,
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
      message: "Profile created",
      data: profile,
    });

  } catch (error) {
    console.error("CREATE PROFILE ERROR:", error);
    next(error);
  }
};



// GET ALL PROFILES
export const getProfiles = async (req, res, next) => {
  try {
    let query = "SELECT * FROM profiles WHERE 1=1";
    const values = [];

    // 🔍 FILTERS
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

    // 🔒 SAFE SORTING
    const allowedSort = ["name", "age", "created_at"];
    const sortBy = allowedSort.includes(req.query.sort_by)
      ? req.query.sort_by
      : "created_at";

    const order =
      req.query.order && req.query.order.toLowerCase() === "asc"
        ? "ASC"
        : "DESC";

    query += ` ORDER BY ${sortBy} ${order}`;

    // 📄 PAGINATION
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const offset = parseInt(req.query.offset) || 0;

    values.push(limit, offset);
    query += ` LIMIT $${values.length - 1} OFFSET $${values.length}`;

    const result = await pool.query(query, values);

    return res.status(200).json({
      status: "success",
      count: result.rows.length,
      data: result.rows,
    });

  } catch (error) {
    console.error("GET PROFILES ERROR:", error);
    next(error);
  }
};



// GET SINGLE PROFILE
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
    console.error("GET PROFILE ERROR:", error);
    next(error);
  }
};



// DELETE PROFILE
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

    return res.status(200).json({
      status: "success",
      message: "Profile deleted successfully",
    });

  } catch (error) {
    console.error("DELETE PROFILE ERROR:", error);
    next(error);
  }
};