import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple translation dictionaries
const translations = {
  // Building Materials
  "Matériaux de construction": { es: "Materiales de construcción", it: "Materiali da costruzione" },
  "Matériel de construction": { es: "Material de construcción", it: "Materiale da costruzione" },
  "Gros œuvre": { es: "Obra gruesa", it: "Opera grezza" },
  "Bétonnière": { es: "Hormigonera", it: "Betoniera" },
  "Échafaudage": { es: "Andamio", it: "Ponteggio" },
  "Ciment et mortier": { es: "Cemento y mortero", it: "Cemento e malta" },
  
  // Garden
  "Jardin - Aménagement extérieur": { es: "Jardín - Paisajismo exterior", it: "Giardino - Paesaggistica esterna" },
  "Outillage et entretien du terrain": { es: "Herramientas y mantenimiento del terreno", it: "Attrezzi e manutenzione del terreno" },
  "Arrosage et récupération d'eau": { es: "Riego y recuperación de agua", it: "Irrigazione e recupero dell'acqua" },
  "Taille du bois et de la haie": { es: "Poda de madera y setos", it: "Potatura del legno e siepi" },
  "Coupe du bois": { es: "Corte de madera", it: "Taglio del legno" },
  "Matériel d'arrosage": { es: "Material de riego", it: "Materiale per irrigazione" },
  "Tondeuse": { es: "Cortacésped", it: "Tosaerba" },
  "Tronçonneuse": { es: "Motosierra", it: "Motosega" },
  "Tuyau d'arrosage": { es: "Manguera de riego", it: "Tubo per irrigazione" },
  
  // Common terms
  "électrique": { es: "eléctrica", it: "elettrica" },
  "thermique": { es: "térmica", it: "termica" },
  "roulant": { es: "móvil", it: "mobile" },
  "Tondeuse électrique": { es: "Cortacésped eléctrico", it: "Tosaerba elettrico" },
  "Tondeuse thermique": { es: "Cortacésped térmico", it: "Tosaerba termico" },
  "Tronçonneuse électrique": { es: "Motosierra eléctrica", it: "Motosega elettrica" },
  "Portland": { es: "Portland", it: "Portland" },
};

const descriptionTranslations = {
  "Tous les matériaux nécessaires à la construction": {
    es: "Todos los materiales necesarios para la construcción",
    it: "Tutti i materiali necessari per la costruzione"
  },
  "Équipements et outils pour la construction": {
    es: "Equipos y herramientas para la construcción",
    it: "Attrezzature e strumenti per la costruzione"
  },
  "Matériaux pour le gros œuvre": {
    es: "Materiales para la obra gruesa",
    it: "Materiali per l'opera grezza"
  },
  "Machines pour mélanger le béton": {
    es: "Máquinas para mezclar hormigón",
    it: "Macchine per mescolare il calcestruzzo"
  },
  "Structures temporaires pour travaux en hauteur": {
    es: "Estructuras temporales para trabajos en altura",
    it: "Strutture temporanee per lavori in altezza"
  },
  "Liants hydrauliques pour construction": {
    es: "Aglutinantes hidráulicos para construcción",
    it: "Leganti idraulici per costruzione"
  },
  "Bétonnière alimentée par électricité": {
    es: "Hormigonera alimentada por electricidad",
    it: "Betoniera alimentata elettricamente"
  },
  "Bétonnière avec moteur thermique": {
    es: "Hormigonera con motor térmico",
    it: "Betoniera con motore termico"
  },
  "Échafaudage avec roues pour déplacement facile": {
    es: "Andamio con ruedas para facilitar el movimiento",
    it: "Ponteggio con ruote per spostamento facile"
  },
  "Échafaudage mobile sur roulettes": {
    es: "Andamio móvil sobre ruedas",
    it: "Ponteggio mobile su ruote"
  },
  "Ciment standard pour usage courant": {
    es: "Cemento estándar para uso común",
    it: "Cemento standard per uso comune"
  },
  "Tout pour l'aménagement et l'entretien du jardin": {
    es: "Todo para el paisajismo y mantenimiento del jardín",
    it: "Tutto per la paesaggistica e la manutenzione del giardino"
  },
  "Outils pour l'entretien des espaces verts": {
    es: "Herramientas para el mantenimiento de espacios verdes",
    it: "Attrezzi per la manutenzione di spazi verdi"
  },
  "Systèmes d'arrosage et récupération d'eau de pluie": {
    es: "Sistemas de riego y recuperación de agua de lluvia",
    it: "Sistemi di irrigazione e recupero dell'acqua piovana"
  },
  "Outils pour tailler arbres et haies": {
    es: "Herramientas para podar árboles y setos",
    it: "Attrezzi per potare alberi e siepi"
  },
  "Outils pour couper le bois": {
    es: "Herramientas para cortar madera",
    it: "Attrezzi per tagliare legno"
  },
  "Équipement pour l'arrosage du jardin": {
    es: "Equipo para el riego del jardín",
    it: "Attrezzatura per l'irrigazione del giardino"
  },
  "Machines pour tondre le gazon": {
    es: "Máquinas para cortar el césped",
    it: "Macchine per tagliare l'erba"
  },
  "Machines pour couper le bois": {
    es: "Máquinas para cortar madera",
    it: "Macchine per tagliare legno"
  },
  "Tubes pour l'arrosage": {
    es: "Tubos para el riego",
    it: "Tubi per l'irrigazione"
  },
  "Tondeuse avec moteur électrique": {
    es: "Cortacésped con motor eléctrico",
    it: "Tosaerba con motore elettrico"
  },
  "Tondeuse avec moteur thermique": {
    es: "Cortacésped con motor térmico",
    it: "Tosaerba con motore termico"
  },
  "Tronçonneuse alimentée par électricité": {
    es: "Motosierra alimentada por electricidad",
    it: "Motosega alimentata elettricamente"
  },
  "Tuyau flexible pour arrosage": {
    es: "Manguera flexible para riego",
    it: "Tubo flessibile per irrigazione"
  },
};

// Read the database file
const dbPath = path.join(__dirname, '..', 'lib', 'product-database.ts');
let content = fs.readFileSync(dbPath, 'utf-8');

console.log('[v0] Starting translation addition...');

// Function to translate a text
function translateText(text, lang) {
  if (!text) return '';
  
  // Check direct translation
  if (translations[text]) {
    return translations[text][lang] || text;
  }
  
  // Check description translations
  if (descriptionTranslations[text]) {
    return descriptionTranslations[text][lang] || text;
  }
  
  // Simple word-by-word translation for common terms
  let result = text;
  for (const [fr, trans] of Object.entries(translations)) {
    if (text.includes(fr)) {
      result = result.replace(fr, trans[lang] || fr);
    }
  }
  
  return result || text;
}

// Process productDatabase entries
const productDbRegex = /{\s*id:\s*"([^"]+)",\s*type:\s*"([^"]+)",\s*nameFr:\s*"([^"]*)",\s*nameEn:\s*"([^"]*)",\s*descriptionFr:\s*"([^"]*)",\s*descriptionEn:\s*"([^"]*)"/g;

let match;
let replacements = [];

while ((match = productDbRegex.exec(content)) !== null) {
  const [fullMatch, id, type, nameFr, nameEn, descriptionFr, descriptionEn] = match;
  
  // Check if already has translations
  const afterMatch = content.slice(match.index + fullMatch.length, match.index + fullMatch.length + 200);
  if (afterMatch.includes('nameEs') || afterMatch.includes('nameIt')) {
    continue; // Skip if already translated
  }
  
  const nameEs = translateText(nameFr, 'es');
  const nameIt = translateText(nameFr, 'it');
  const descriptionEs = translateText(descriptionFr, 'es');
  const descriptionIt = translateText(descriptionFr, 'it');
  
  const replacement = `{
    id: "${id}",
    type: "${type}",
    nameFr: "${nameFr}",
    nameEn: "${nameEn}",
    nameEs: "${nameEs}",
    nameIt: "${nameIt}",
    descriptionFr: "${descriptionFr}",
    descriptionEn: "${descriptionEn}",
    descriptionEs: "${descriptionEs}",
    descriptionIt: "${descriptionIt}"`;
  
  replacements.push({ original: fullMatch, replacement, index: match.index });
}

console.log(`[v0] Found ${replacements.length} items to translate`);

// Apply replacements in reverse order to maintain indices
replacements.reverse().forEach(({ original, replacement, index }) => {
  content = content.slice(0, index) + replacement + content.slice(index + original.length);
});

// Write back to file
fs.writeFileSync(dbPath, content, 'utf-8');

console.log('[v0] Translations added successfully!');
