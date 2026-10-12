export function customSlugify(input) {
  if (!input) return '';

  return input
    .trim()
    // 1. Remove Arabic diacritics (Tashkeel)
    .replace(/[\u064B-\u0652]/g, '')
    // 2. Convert English characters to lowercase
    .toLowerCase()
    // 3. Remove slashes, invalid OS characters, and Arabic/English punctuation
    .replace(/[/?#%^&*()+=!$@~`\\|{}[\]:;"'<>,.?؟،؛]/g, '')
    // 4. Convert spaces and whitespace runs into single hyphens
    .replace(/\s+/g, '-')
    // 5. Collapse consecutive hyphens
    .replace(/-+/g, '-')
    // 6. Cap length at 60 characters (prevents massive URLs)
    .slice(0, 60)
    // 7. Trim hyphens from start or end (after the cap, so a cut can never leave a trailing hyphen)
    .replace(/^-+|-+$/g, '');
}