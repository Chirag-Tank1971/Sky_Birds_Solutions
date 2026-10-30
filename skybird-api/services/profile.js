// Customer profile rules shared by sign-up and profile editing.
// Keep PROFESSIONS in sync with skybird-user-frontend/src/data/profile.js.
const PROFESSIONS = ["Student", "Working professional", "Business owner", "Marketplace seller", "Other"];

// Returns { name, age, profession } cleaned, or null if any field is missing or invalid.
function parseProfile(body) {
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const age = Number(body?.age);
  const profession = typeof body?.profession === "string" ? body.profession.trim() : "";
  if (name.length < 2 || name.length > 100 || /[\u0000-\u001F\u007F]/.test(name)) return null;
  if (!Number.isInteger(age) || age < 13 || age > 100) return null;
  if (!PROFESSIONS.includes(profession)) return null;
  return { name, age, profession };
}

module.exports = { PROFESSIONS, parseProfile };
