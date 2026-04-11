import { expandQueryVariants } from './lib/utils/kana-convert.ts';

function escapePattern(s: string): string {
  return s.replace(/[%,()]/g, ' ').trim();
}

const query = 'ナポリタン';
console.log('=== Debug Query Variants ===');
console.log('Original query:', JSON.stringify(query));
console.log('Character codes:', Array.from(query).map(c => c.codePointAt(0)?.toString(16)).join(' '));

const escaped = escapePattern(query);
console.log('After escapePattern:', JSON.stringify(escaped));

const variants = expandQueryVariants(escaped);
console.log('expandQueryVariants result:', variants);

const escapedVariants = variants.map(escapePattern).filter(v => v.length > 0);
console.log('After second escapePattern + filter:', escapedVariants);

const conditions: string[] = [];
const seen = new Set<string>();
for (const v of escapedVariants) {
  if (seen.has(v)) continue;
  seen.add(v);
  const pattern = `%${v}%`;
  conditions.push(`name.ilike.${pattern}`);
  conditions.push(`name_kana.ilike.${pattern}`);
}

console.log('Final OR conditions:', conditions);
console.log('OR clause length:', conditions.length);
console.log('OR clause:', conditions.join(','));