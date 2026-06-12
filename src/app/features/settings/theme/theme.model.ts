export type RadiusPreset = 'square' | 'rounded' | 'pill';

export interface ThemeConfig {
  primaryColor:    string;
  backgroundColor: string;
  textColor:       string;
  fontFamily:      string;
  borderRadius:    RadiusPreset;
}

export const RADIUS_PRESETS: { key: RadiusPreset; label: string; px: number }[] = [
  { key: 'square',  label: 'Cuadrado',   px: 4   },
  { key: 'rounded', label: 'Redondeado', px: 12  },
  { key: 'pill',    label: 'Pastilla',   px: 999 },
];

export const CURATED_FONTS: { family: string; googleParam: string }[] = [
  { family: 'Inter',            googleParam: 'Inter:wght@400;600'            },
  { family: 'Poppins',          googleParam: 'Poppins:wght@400;600'          },
  { family: 'Nunito',           googleParam: 'Nunito:wght@400;600'           },
  { family: 'Montserrat',       googleParam: 'Montserrat:wght@400;600'       },
  { family: 'Lato',             googleParam: 'Lato:wght@400;700'             },
  { family: 'Raleway',          googleParam: 'Raleway:wght@400;600'          },
  { family: 'Playfair Display', googleParam: 'Playfair+Display:wght@400;600' },
  { family: 'Merriweather',     googleParam: 'Merriweather:wght@400;700'     },
  { family: 'Source Sans 3',    googleParam: 'Source+Sans+3:wght@400;600'    },
  { family: 'DM Sans',          googleParam: 'DM+Sans:wght@400;600'          },
];

export const DEFAULT_THEME: ThemeConfig = {
  primaryColor:    '#2563eb',
  backgroundColor: '#ffffff',
  textColor:       '#0f172a',
  fontFamily:      'Inter',
  borderRadius:    'rounded',
};
