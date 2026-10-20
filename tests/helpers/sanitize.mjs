// Pure emoji stripper that removes all pictographs, variation selectors, and regional flags while preserving Spanish accents
function sanitizeDishName(name) {
  return name
    .replace(/\p{Extended_Pictographic}|[\u{1F1E6}-\u{1F1FF}]|[\u{FE00}-\u{FE0F}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}
