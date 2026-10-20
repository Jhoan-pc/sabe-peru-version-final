import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const mainTs = fs.readFileSync(path.join(rootDir, 'src', 'main.ts'), 'utf8');
const styleCss = fs.readFileSync(path.join(rootDir, 'src', 'style.css'), 'utf8');
const cartaHtml = fs.readFileSync(path.join(rootDir, 'carta.html'), 'utf8');
const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');

console.log('=== FORENSIC INVARIANT CHECK 1: DEFECT FIXES ===');
// Fix 1: Escape key listener
const hasEscapeKey = mainTs.includes("e.key === 'Escape'") && mainTs.includes('closePhotoModal()');
console.log('1. Escape key listener in main.ts:', hasEscapeKey);

// Fix 2: Modal listener decoupling
const closeBtnBinding = mainTs.indexOf("closeModalBtn?.addEventListener('click', closePhotoModal)");
const loadMenuDef = mainTs.indexOf('async function loadMenu(');
const isDecoupled = closeBtnBinding > -1 && loadMenuDef > -1 && closeBtnBinding < loadMenuDef;
console.log('2. Modal listeners decoupled from loadMenu:', isDecoupled, `(closeBtn: ${closeBtnBinding}, loadMenu: ${loadMenuDef})`);

// Fix 3: Defensive Array.isArray guard
const hasArrayGuardRender = /Array\.isArray\(item\.tags\)\s*\?\s*item\.tags\s*:\s*\[\]/.test(mainTs);
const hasArrayGuardLoad = /Array\.isArray\(d\.tags\)\s*\?\s*d\.tags\s*:\s*\[\]/.test(mainTs);
console.log('3. Defensive Array.isArray guard in renderMenuItemHtml:', hasArrayGuardRender);
console.log('   Defensive Array.isArray guard in loadMenu filter:', hasArrayGuardLoad);

// Fix 4: Double quote escaping
const hasNameEscaped = mainTs.includes("cleanName.replace(/\"/g, '&quot;')");
const hasDescEscaped = mainTs.includes("(item.description || '').replace(/\"/g, '&quot;')");
console.log('4. HTML attribute quote escaping (name):', hasNameEscaped);
console.log('   HTML attribute quote escaping (desc):', hasDescEscaped);

// Fix 5: Flex-wrap header layout
const hasFlexWrap = /\.menu-item-header\s*\{[^}]*flex-wrap:\s*wrap;/s.test(styleCss);
console.log('5. .menu-item-header has flex-wrap: wrap in style.css:', hasFlexWrap);

console.log('\n=== FORENSIC INVARIANT CHECK 2: CORE M3 INVARIANTS ===');
// Emojis in menu
const menuScope = mainTs.slice(0, mainTs.indexOf('async function loadGallery'));
const emojiRegex = /\p{Extended_Pictographic}/gu;
const menuEmojis = menuScope.match(emojiRegex) || [];
console.log('1. Emojis in main.ts menu scope (lines 1-525):', menuEmojis.length, menuEmojis);
console.log('   tagIcons presence:', mainTs.includes('tagIcons'));

// 16 AllergenTag enum values
const canonicalTags = [
  'pescado', 'marisco', 'carne', 'pollo', 'picante', 'gluten-free', 'gluten',
  'huevos', 'lacteos', 'soja', 'cacahuetes', 'mostaza', 'crustaceos', 'apio',
  'moluscos', 'sesamo'
];
const matchesAllTags = canonicalTags.every(tag => mainTs.includes(`'${tag}'`));
console.log('2. 16 AllergenTag enum values present in main.ts:', matchesAllTags);

// Dual pricing class
const hasDualClass = mainTs.includes("priceClass: 'menu-item-price dual'");
console.log('3. Dual pricing class .menu-item-price.dual in main.ts:', hasDualClass);

// Wikimedia raster URLs
const hasWikimediaInCss = styleCss.toLowerCase().includes('wikimedia');
const hasWikimediaInMain = mainTs.toLowerCase().includes('wikimedia');
const hasWikimediaInCarta = cartaHtml.toLowerCase().includes('wikimedia');
const hasWikimediaInIndex = indexHtml.toLowerCase().includes('wikimedia');
console.log('4. Zero Wikimedia URLs: CSS:', !hasWikimediaInCss, 'Main:', !hasWikimediaInMain, 'Carta:', !hasWikimediaInCarta, 'Index:', !hasWikimediaInIndex);

// Strict typing in menu scope
const anyMatches = (menuScope.match(/:\s*any\b/g) || []).length;
console.log('5. Strict typing: ": any" count in main.ts menu scope:', anyMatches);
