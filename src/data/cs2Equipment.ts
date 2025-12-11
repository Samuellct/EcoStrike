export type Team = 'CT' | 'T';
export type ArmorType = 'none' | 'vest' | 'helmet';

export interface Weapon {
  name: string;
  price: number;
  killReward: number;
  team?: Team;
}

export interface Equipment {
  name: string;
  price: number;
}

export const STARTING_PISTOLS: Record<Team, Weapon[]> = {
  CT: [
    { name: 'USP-S', price: 0, killReward: 300 },
    { name: 'P2000', price: 0, killReward: 300 },
  ],
  T: [
    { name: 'Glock-18', price: 0, killReward: 300 },
  ],
};

export const PISTOLS: Weapon[] = [
  { name: 'P250', price: 300, killReward: 300 },
  { name: 'Five-SeveN', price: 500, killReward: 300, team: 'CT' },
  { name: 'Tec-9', price: 500, killReward: 300, team: 'T' },
  { name: 'CZ75-Auto', price: 500, killReward: 300 },
  { name: 'Desert Eagle', price: 700, killReward: 300 },
  { name: 'R8 Revolver', price: 600, killReward: 300 },
  { name: 'Dual Berettas', price: 400, killReward: 300 },
];

export const SMGS: Weapon[] = [
  { name: 'MAC-10', price: 1050, killReward: 600, team: 'T' },
  { name: 'MP9', price: 1250, killReward: 600, team: 'CT' },
  { name: 'MP7', price: 1500, killReward: 600 },
  { name: 'MP5-SD', price: 1500, killReward: 600 },
  { name: 'UMP-45', price: 1200, killReward: 600 },
  { name: 'PP-Bizon', price: 1400, killReward: 600 },
  { name: 'P90', price: 2350, killReward: 300 },
];

export const SHOTGUNS: Weapon[] = [
  { name: 'Sawed-Off', price: 1100, killReward: 900, team: 'T' },
  { name: 'Nova', price: 1050, killReward: 900 },
  { name: 'XM1014', price: 2000, killReward: 600 },
  { name: 'MAG-7', price: 1300, killReward: 900, team: 'CT' },
];

export const RIFLES: Weapon[] = [
  { name: 'FAMAS', price: 2050, killReward: 300, team: 'CT' },
  { name: 'Galil AR', price: 1800, killReward: 300, team: 'T' },
  { name: 'M4A4', price: 3100, killReward: 300, team: 'CT' },
  { name: 'M4A1-S', price: 2900, killReward: 300, team: 'CT' },
  { name: 'AK-47', price: 2700, killReward: 300, team: 'T' },
  { name: 'SSG 08', price: 1700, killReward: 100 },
  { name: 'AUG', price: 3300, killReward: 300, team: 'CT' },
  { name: 'SG 553', price: 3000, killReward: 300, team: 'T' },
  { name: 'AWP', price: 4750, killReward: 100 },
  { name: 'G3SG1', price: 5000, killReward: 100, team: 'T' },
  { name: 'SCAR-20', price: 5000, killReward: 100, team: 'CT' },
];

export const MACHINE_GUNS: Weapon[] = [
  { name: 'M249', price: 5200, killReward: 300 },
  { name: 'Negev', price: 1700, killReward: 300 },
];

export const GRENADES: Equipment[] = [
  { name: 'HE Grenade', price: 300 },
  { name: 'Flashbang', price: 200 },
  { name: 'Smoke Grenade', price: 300 },
  { name: 'Incendiary Grenade', price: 600 },
  { name: 'Molotov', price: 400 },
  { name: 'Decoy Grenade', price: 50 },
];

export const ARMOR_PRICES = {
  vest: 650,
  helmet: 1000,
};

export const EQUIPMENT_PRICES = {
  defuseKit: 400,
  zeus: 200,
};

export const ECONOMIC_CONSTANTS = {
  startingMoney: 800,
  halftimeMoney: 800, // Reset à la mi-temps
  overtimeMoney: 16000, // Prolongation mode Premier
  winByElimination: 3500, // A VERIF, maybe 3250
  winByObjective: 3500, // Victoire "normale" selon le side
  ctTeamKillBonus: 50, // Bonus partagé CT
  tPlantBonus: 800, // Bonus plant
  tPlanterBonus: 300, // Bonus individuel planteur
  ctDefuseBonus: 300, // Bonus defuse
  knifeKillReward: 1500,
  zeusKillReward: 0, // Zeus donne 0$ si on kill avec
  lossBonus: [1400, 1900, 2400, 2900, 3400],
};

// Tous les kill rewards par arme
export const KILL_REWARDS: Record<string, number> = {
  'Knife': 1500,
  'Zeus x27': 0,
  // SMGs (sauf P90)
  'MAC-10': 600,
  'MP9': 600,
  'MP7': 600,
  'MP5-SD': 600,
  'UMP-45': 600,
  'PP-Bizon': 600,
  // Shotguns (sauf XM1014)
  'Nova': 900,
  'Sawed-Off': 900,
  'MAG-7': 900,
  // Default (rifles, pistols, LMGs, P90, XM1014)
  'P90': 300,
  'XM1014': 300,
  // Snipers
  'SSG 08': 100,
  'AWP': 100,
  'G3SG1': 100,
  'SCAR-20': 100,
};

export function getKillReward(weaponName: string): number {
  return KILL_REWARDS[weaponName] ?? 300; // Default 300 juste pr test
}

export function getAllWeapons(team: Team): Weapon[] {
  const allWeapons = [
    ...PISTOLS.filter(w => !w.team || w.team === team),
    ...SMGS.filter(w => !w.team || w.team === team),
    ...SHOTGUNS.filter(w => !w.team || w.team === team),
    ...RIFLES.filter(w => !w.team || w.team === team),
    ...MACHINE_GUNS,
  ];
  return allWeapons;
}

export function getWeaponPrice(weaponName: string): number {
  const allWeapons = [...PISTOLS, ...SMGS, ...SHOTGUNS, ...RIFLES, ...MACHINE_GUNS];
  const weapon = allWeapons.find(w => w.name === weaponName);
  return weapon?.price || 0;
}

export function getGrenadePrice(grenadeName: string): number {
  const grenade = GRENADES.find(g => g.name === grenadeName);
  return grenade?.price || 0;
}

// Liste complète de toutes les armes pour le menu déroulant des kills
export function getAllWeaponNames(): string[] {
  return [
    'Knife',
    'Zeus x27',
    ...STARTING_PISTOLS.CT.map(w => w.name),
    ...STARTING_PISTOLS.T.map(w => w.name),
    ...PISTOLS.map(w => w.name),
    ...SMGS.map(w => w.name),
    ...SHOTGUNS.map(w => w.name),
    ...RIFLES.map(w => w.name),
    ...MACHINE_GUNS.map(w => w.name),
    'HE Grenade',
  ];
}