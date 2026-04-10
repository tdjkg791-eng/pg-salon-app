import type { CourseType } from '../supabase/types';

export const MASSAGE_PRICE_PER_SESSION = 10400;
export const KNOWHOW_PRICE = 20000;
export const ADVICE_PRICE_PER_DAY = 1000;
export const EXTENSION_MASSAGE = 10400;
export const EXTENSION_ADVICE_DAYS = 7;

export interface CourseConfig {
  days: number;
  sessions: number;
  targetLoss: number;
}

export const COURSE_CONFIG: Record<CourseType, CourseConfig> = {
  '5w': { days: 35, sessions: 5, targetLoss: 5 },
  '7w': { days: 49, sessions: 7, targetLoss: 7 },
  '9w': { days: 63, sessions: 9, targetLoss: 9 },
};

export interface PriceBreakdown {
  massage: number;
  knowhow: number;
  advice: number;
  total: number;
  extension: number;
}

export function calculatePrice(courseType: CourseType, isRepeat: boolean): PriceBreakdown {
  const cfg = COURSE_CONFIG[courseType];
  const massage = MASSAGE_PRICE_PER_SESSION * cfg.sessions;
  const knowhow = isRepeat ? 0 : KNOWHOW_PRICE;
  const advice = ADVICE_PRICE_PER_DAY * cfg.days;
  const total = massage + knowhow + advice;
  const extension = EXTENSION_MASSAGE + ADVICE_PRICE_PER_DAY * EXTENSION_ADVICE_DAYS;

  return { massage, knowhow, advice, total, extension };
}
