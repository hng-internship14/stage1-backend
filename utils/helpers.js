export const getAgeGroup = (age) => {
  if (age <= 12) return "child";
  if (age <= 19) return "teenager";
  if (age <= 59) return "adult";
  return "senior";
};

export const getTopCountry = (countries) => {
  if (!countries || countries.length === 0) return null;

  return countries.reduce((prev, current) =>
    current.probability > prev.probability ? current : prev
  );
};