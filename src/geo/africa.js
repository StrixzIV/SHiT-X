// ISO 3166-1 alpha-2 country codes for Africa (54 sovereign nations + territories)
export const AFRICA_COUNTRY_CODES = new Set([
  'DZ', 'AO', 'BJ', 'BW', 'BF', 'BI', 'CV', 'CM', 'CF', 'TD',
  'KM', 'CD', 'CG', 'CI', 'DJ', 'EG', 'GQ', 'ER', 'SZ', 'ET',
  'GA', 'GM', 'GH', 'GN', 'GW', 'KE', 'LS', 'LR', 'LY', 'MG',
  'MW', 'ML', 'MR', 'MU', 'YT', 'MA', 'MZ', 'NA', 'NE', 'NG',
  'RE', 'RW', 'SH', 'ST', 'SN', 'SC', 'SL', 'SO', 'ZA', 'SS',
  'SD', 'TZ', 'TG', 'TN', 'UG', 'EH', 'ZM', 'ZW', 'IO', 'TF'
])

export const AFRICA_COUNTRY_NAMES = {
  DZ: 'Algeria', AO: 'Angola', BJ: 'Benin', BW: 'Botswana', BF: 'Burkina Faso',
  BI: 'Burundi', CV: 'Cabo Verde', CM: 'Cameroon', CF: 'Central African Republic',
  TD: 'Chad', KM: 'Comoros', CD: 'DR Congo', CG: 'Congo', CI: "Côte d'Ivoire",
  DJ: 'Djibouti', EG: 'Egypt', GQ: 'Equatorial Guinea', ER: 'Eritrea',
  SZ: 'Eswatini', ET: 'Ethiopia', GA: 'Gabon', GM: 'Gambia', GH: 'Ghana',
  GN: 'Guinea', GW: 'Guinea-Bissau', KE: 'Kenya', LS: 'Lesotho', LR: 'Liberia',
  LY: 'Libya', MG: 'Madagascar', MW: 'Malawi', ML: 'Mali', MR: 'Mauritania',
  MU: 'Mauritius', YT: 'Mayotte', MA: 'Morocco', MZ: 'Mozambique', NA: 'Namibia',
  NE: 'Niger', NG: 'Nigeria', RE: 'Réunion', RW: 'Rwanda', SH: 'Saint Helena',
  ST: 'Sao Tome and Principe', SN: 'Senegal', SC: 'Seychelles', SL: 'Sierra Leone',
  SO: 'Somalia', ZA: 'South Africa', SS: 'South Sudan', SD: 'Sudan',
  TZ: 'Tanzania', TG: 'Togo', TN: 'Tunisia', UG: 'Uganda', EH: 'Western Sahara',
  ZM: 'Zambia', ZW: 'Zimbabwe', IO: 'British Indian Ocean Territory',
  TF: 'French Southern Territories'
}

export function isAfricaRegion(code) {
  if (!code || typeof code !== 'string') return false
  return AFRICA_COUNTRY_CODES.has(code.trim().toUpperCase())
}
