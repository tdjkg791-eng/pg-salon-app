export interface WeightJudgement {
  diff: number;
  label: string;
  severity: 'good' | 'info' | 'warning' | 'danger';
}

export function judgeDailyVariation(morningKg: number, eveningKg: number): WeightJudgement {
  const diff = Math.round((eveningKg - morningKg) * 100) / 100;
  const abs = Math.abs(diff);

  if (abs >= 0.3 && abs <= 0.5) {
    return { diff, label: '✓ 理想的', severity: 'good' };
  }
  if (abs < 0.3) {
    return { diff, label: 'やや少なめ', severity: 'info' };
  }
  if (abs <= 0.8) {
    return { diff, label: 'やや多め', severity: 'warning' };
  }
  return { diff, label: '⚠ 水分・塩分過多の可能性', severity: 'danger' };
}

export function proteinTarget(weightKg: number): number {
  return Math.round(weightKg * 2);
}

export function waterTarget(dayNumber: number): number {
  return dayNumber <= 14 ? 2000 : 3000;
}
