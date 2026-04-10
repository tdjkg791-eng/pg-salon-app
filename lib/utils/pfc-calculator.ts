export interface Pfc {
  protein_g: number;
  fat_g: number;
  carb_g: number;
  calories_kcal: number;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function scalePfc(base: Pfc, quantityG: number, servingG = 100): Pfc {
  const ratio = servingG > 0 ? quantityG / servingG : 0;
  return {
    protein_g: round1(base.protein_g * ratio),
    fat_g: round1(base.fat_g * ratio),
    carb_g: round1(base.carb_g * ratio),
    calories_kcal: Math.round(base.calories_kcal * ratio),
  };
}

export function sumPfc(items: Pfc[]): Pfc {
  const acc: Pfc = { protein_g: 0, fat_g: 0, carb_g: 0, calories_kcal: 0 };
  for (const it of items) {
    acc.protein_g += it.protein_g;
    acc.fat_g += it.fat_g;
    acc.carb_g += it.carb_g;
    acc.calories_kcal += it.calories_kcal;
  }
  return {
    protein_g: round1(acc.protein_g),
    fat_g: round1(acc.fat_g),
    carb_g: round1(acc.carb_g),
    calories_kcal: Math.round(acc.calories_kcal),
  };
}

export function proteinTarget(weightKg: number): number {
  return Math.round(weightKg * 2);
}
