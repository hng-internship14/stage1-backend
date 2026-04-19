import axios from "axios";
import { pool } from "../config/db.js";
import { getAgeGroup } from "../utils/helpers.js";
import { v7 as uuidv7 } from "uuid";   // Recommended: use v7

// CREATE PROFILE
export const createProfile = async (req, res, next) => {
  try {
    const body = req.body || {};
    let { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Name is required and must be a non-empty string"
      });
    }

    name = name.trim();
    const cleanName = name.toLowerCase();

    // Numeric name → 422
    if (!isNaN(Number(name)) && name.trim() !== "") {
      return res.status(422).json({
        status: "error",
        message: "Name must be a valid string"
      });
    }

    // IDEMPOTENCY
    const existing = await pool.query(
      "SELECT * FROM profiles WHERE LOWER(name) = $1",
      [cleanName]
    );

    if (existing.rows.length > 0) {
      return res.status(200).json({
        status: "success",
        message: "Profile already exists",
        data: existing.rows[0]
      });
    }

    // Call three APIs
    const [genderRes, ageRes, nationRes] = await Promise.allSettled([
      axios.get(`https://api.genderize.io?name=${cleanName}`),
      axios.get(`https://api.agify.io?name=${cleanName}`),
      axios.get(`https://api.nationalize.io?name=${cleanName}`)
    ]);

    const genderData = genderRes.status === "fulfilled" ? genderRes.value.data : null;
    const ageData = ageRes.status === "fulfilled" ? ageRes.value.data : null;
    const nationData = nationRes.status === "fulfilled" ? nationRes.value.data : null;

    // 502 Edge Cases (as required by task)
    if (!genderData || genderData.gender === null || (genderData.count || 0) === 0) {
      return res.status(502).json({
        status: "error",
        message: "Genderize returned an invalid response"
      });
    }

    if (!ageData || ageData.age === null) {
      return res.status(502).json({
        status: "error",
        message: "Agify returned an invalid response"
      });
    }

    if (!nationData || !nationData.country || nationData.country.length === 0) {
      return res.status(502).json({
        status: "error",
        message: "Nationalize returned an invalid response"
      });
    }

    const topCountry = nationData.country.reduce((a, b) =>
      a.probability > b.probability ? a : b
    );

    const profile = {
      id: uuidv7(),
      name: cleanName,
      gender: genderData.gender,
      gender_probability: Number(genderData.probability?.toFixed(2)) || 0,
      sample_size: genderData.count || 0,
      age: ageData.age,
      age_group: getAgeGroup(ageData.age),
      country_id: topCountry.country_id,
      country_probability: Number(topCountry.probability?.toFixed(2)) || 0,
      created_at: new Date().toISOString()
    };

    await pool.query(
      `INSERT INTO profiles 
       (id, name, gender, gender_probability, sample_size, age, age_group, 
        country_id, country_probability, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        profile.id, profile.name, profile.gender, profile.gender_probability,
        profile.sample_size, profile.age, profile.age_group,
        profile.country_id, profile.country_probability, profile.created_at
      ]
    );

    return res.status(201).json({
      status: "success",
      data: profile
    });

  } catch (error) {
    console.error("CREATE PROFILE ERROR:", error);
    next(error);
  }
};

// GET ALL PROFILES (Simplified fields as per task example)
export const getProfiles = async (req, res, next) => {
  try {
    let query = `
      SELECT id, name, gender, age, age_group, country_id 
      FROM profiles WHERE 1=1
    `;
    const values = [];
    let paramIndex = 1;

    if (req.query.gender) {
      values.push(req.query.gender.toLowerCase());
      query += ` AND LOWER(gender) = $${paramIndex++}`;
    }

    if (req.query.age_group) {
      values.push(req.query.age_group.toLowerCase());
      query += ` AND LOWER(age_group) = $${paramIndex++}`;
    }

    if (req.query.country_id) {
      values.push(req.query.country_id.toUpperCase());
      query += ` AND UPPER(country_id) = $${paramIndex++}`;
    }

    query += " ORDER BY created_at DESC";

    const result = await pool.query(query, values);

    return res.status(200).json({
      status: "success",
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error("GET PROFILES ERROR:", error);
    next(error);
  }
};

// GET SINGLE
export const getProfile = async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT * FROM profiles WHERE id = $1",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Profile not found"
      });
    }

    return res.status(200).json({
      status: "success",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("GET PROFILE ERROR:", error);
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

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Profile not found"
      });
    }

    return res.status(204).send();

  } catch (error) {
    console.error("DELETE PROFILE ERROR:", error);
    next(error);
  }
};