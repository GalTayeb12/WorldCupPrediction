/**
 * countryToISO — maps team name → ISO 3166-1 alpha-2 code (lowercase)
 * Used with flag-icons: <span className={`fi fi-${countryToISO(name)}`} />
 * Unknown teams fall back to null (renders a grey placeholder).
 */
const ISO_MAP = {
  // CONCACAF
  "USA":          "us",
  "Canada":       "ca",
  "Mexico":       "mx",
  "Jamaica":      "jm",
  "Costa Rica":   "cr",
  "Panama":       "pa",
  "Honduras":     "hn",

  // CONMEBOL
  "Argentina":    "ar",
  "Brazil":       "br",
  "Colombia":     "co",
  "Ecuador":      "ec",
  "Uruguay":      "uy",
  "Chile":        "cl",
  "Paraguay":     "py",
  "Bolivia":      "bo",
  "Peru":         "pe",
  "Venezuela":    "ve",

  // UEFA
  "France":       "fr",
  "Spain":        "es",
  "Germany":      "de",
  "England":      "gb-eng",  // flag-icons uses regional code
  "Portugal":     "pt",
  "Netherlands":  "nl",
  "Belgium":      "be",
  "Italy":        "it",
  "Croatia":      "hr",
  "Poland":       "pl",
  "Switzerland":  "ch",
  "Denmark":      "dk",
  "Austria":      "at",
  "Serbia":       "rs",
  "Ukraine":      "ua",
  "Turkey":       "tr",
  "Slovakia":     "sk",

  // CAF
  "Morocco":      "ma",
  "Senegal":      "sn",
  "Nigeria":      "ng",
  "Cameroon":     "cm",
  "Ghana":        "gh",
  "Ivory Coast":  "ci",
  "Egypt":        "eg",
  "Tunisia":      "tn",
  "Algeria":      "dz",
  "S. Africa":    "za",
  "South Africa": "za",
  "Burkina F.":   "bf",
  "Burkina Faso": "bf",

  // AFC
  "Japan":        "jp",
  "South Korea":  "kr",
  "Australia":    "au",
  "Iran":         "ir",
  "Saudi Arabia": "sa",
  "Qatar":        "qa",
  "Iraq":         "iq",
  "Jordan":       "jo",

  // OFC
  "New Zealand":  "nz",
};

/**
 * @param {string} name — team name as it appears in the API/mock data
 * @returns {string|null} ISO code or null if unknown
 */
export function countryToISO(name) {
  return ISO_MAP[name] ?? null;
}
