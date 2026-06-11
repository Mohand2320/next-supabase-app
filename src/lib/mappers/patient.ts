export const apiToDb = (obj: any) => {
  const mapped: any = {};
  if (obj.first_name !== undefined) mapped.nom = obj.first_name;
  if (obj.last_name !== undefined) mapped.prenom = obj.last_name;
  if (obj.date_of_birth !== undefined) mapped.date_naissance = obj.date_of_birth || null;
  if (obj.gender !== undefined) {
    // DB enum only supports 'M' or 'F' — map 'Other' -> 'F' (fallback)
    mapped.sexe = obj.gender === 'M' ? 'M' : (obj.gender === 'F' ? 'F' : 'F');
  }
  if (obj.address !== undefined) mapped.adresse = obj.address;
  if (obj.phone !== undefined) mapped.telephone = obj.phone;
  if (obj.email !== undefined) mapped.email = obj.email;
  return mapped;
};

export const dbToApi = (row: any) => {
  if (!row) return row;
  return {
    id: row.id,
    first_name: row.nom ?? row.first_name,
    last_name: row.prenom ?? row.last_name,
    date_of_birth: row.date_naissance ?? row.date_of_birth,
    gender: row.sexe ?? row.gender,
    address: row.adresse ?? row.address,
    phone: row.telephone ?? row.phone,
    email: row.email,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

export const profileApiToDb = (obj: any) => {
  const mapped: any = {};
  if (obj.allergies !== undefined) {
    // accept comma-separated or textarea; convert to array
    if (Array.isArray(obj.allergies)) mapped.allergies = obj.allergies;
    else if (typeof obj.allergies === 'string') mapped.allergies = obj.allergies.split(',').map((s: string) => s.trim()).filter(Boolean);
    else mapped.allergies = null;
  }
  if (obj.medical_history !== undefined) {
    if (Array.isArray(obj.medical_history)) mapped.antecedents = obj.medical_history;
    else if (typeof obj.medical_history === 'string') mapped.antecedents = obj.medical_history.split(',').map((s: string) => s.trim()).filter(Boolean);
    else mapped.antecedents = null;
  }
  return mapped;
};
