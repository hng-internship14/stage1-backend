import axios from "axios";

export const fetchProfileData = async (name) => {
  const genderRes = await axios.get(`https://api.genderize.io?name=${name}`);
  const ageRes = await axios.get(`https://api.agify.io?name=${name}`);
  const countryRes = await axios.get(`https://api.nationalize.io?name=${name}`);

  return {
    name,
    gender: genderRes.data.gender,
    age: ageRes.data.age,
    country: countryRes.data.country?.[0]?.country_id || "Unknown",
  };
};