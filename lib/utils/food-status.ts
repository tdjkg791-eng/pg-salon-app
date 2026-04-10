import type { BodyType, Food } from '../supabase/types';

export interface PgBadge {
  label: string;
  color: string;
}

export interface FoodJudgement {
  canRegister: boolean;
  pgBadge: PgBadge;
  bodyWarning: string | null;
  note: string | null;
}

export function judgeFoodForClient(food: Food, bodyType: BodyType | null): FoodJudgement {
  let pgBadge: PgBadge;
  switch (food.pg_status) {
    case 'ok':
      pgBadge = { label: 'PG OK', color: 'green' };
      break;
    case 'limited':
      pgBadge = { label: 'PG 制限あり', color: 'yellow' };
      break;
    case 'ng':
    default:
      pgBadge = { label: 'PG NG', color: 'red' };
      break;
  }

  const canRegister = food.pg_status !== 'ng';

  let bodyWarning: string | null = null;
  if (bodyType === 'fat_sensitive' && !food.fat_sensitive_ok) {
    bodyWarning = '脂質に弱い体質の方には注意が必要な食品です';
  } else if (bodyType === 'carb_sensitive' && !food.carb_sensitive_ok) {
    bodyWarning = '糖質に弱い体質の方には注意が必要な食品です';
  }

  return {
    canRegister,
    pgBadge,
    bodyWarning,
    note: food.pg_note,
  };
}
