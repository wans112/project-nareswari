export function slugify(text = "") {
  return String(text)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function slugFromCode(value) {
  const raw = typeof value === "string" || typeof value === "number" ? String(value) : "";
  if (!raw.trim()) return "";
  return slugify(raw.replace(/[_\s]+/g, " "));
}

export function canonicalCategorySlug(category = {}) {
  const codeValue = category?.code_kategori ?? category?.codeKategori ?? category?.code ?? "";
  const fromCode = slugFromCode(codeValue);
  if (fromCode) return fromCode;

  const nameValue = category?.nama_kategori ?? category?.nama ?? category?.label ?? "";
  const subValue = category?.sub_kategori ?? category?.subKategori ?? category?.sub ?? "";
  const combined = [nameValue, subValue].filter(Boolean).join(" ");
  const fallback = slugify(combined || nameValue);
  return fallback;
}

export function collectCategoryAliases(category = {}) {
  const aliases = new Set();
  const canonical = canonicalCategorySlug(category);
  if (canonical) aliases.add(canonical);

  const codeAlias = slugFromCode(category?.code_kategori ?? category?.codeKategori ?? category?.code ?? "");
  if (codeAlias) aliases.add(codeAlias);

  const nameAlias = slugify(category?.nama_kategori ?? category?.nama ?? category?.label ?? "");
  if (nameAlias) aliases.add(nameAlias);

  const subAlias = slugify(category?.sub_kategori ?? category?.subKategori ?? category?.sub ?? "");
  if (subAlias) aliases.add(subAlias);

  const hasName = Boolean(category?.nama_kategori ?? category?.nama);
  const hasSub = Boolean(category?.sub_kategori ?? category?.subKategori ?? category?.sub);
  if (hasName && hasSub) {
    const combined = slugify(`${category?.nama_kategori ?? category?.nama} ${category?.sub_kategori ?? category?.subKategori ?? category?.sub}`);
    if (combined) aliases.add(combined);
  }

  return aliases;
}

export function resolveCanonicalCategorySlug(input, categories = []) {
  const target = slugify(input);
  if (!target) return "";
  for (const category of categories) {
    const aliases = collectCategoryAliases(category);
    if (aliases.has(target)) {
      const canonical = canonicalCategorySlug(category);
      if (canonical) return canonical;
    }
  }
  return target;
}

export function categoryMatchesSlug(category, slug) {
  const normalized = slugify(slug);
  if (!normalized) return false;
  const aliases = collectCategoryAliases(category);
  return aliases.has(normalized);
}

export function titleFromSlug(slug = "") {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
