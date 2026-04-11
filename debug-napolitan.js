// Quick debug script to check query variant expansion for ナポリタン
const { expandQueryVariants } = require('./lib/utils/kana-convert.ts');

function escapePattern(s) {
  return s.replace(/[%,()]/g, ' ').trim();
}

const query = 'ナポリタン';
console.log('Original query:', JSON.stringify(query));
console.log('Escaped:', JSON.stringify(escapePattern(query)));

const variants = expandQueryVariants(query);
console.log('Variants:', variants);

const escapedVariants = variants.map(escapePattern).filter(v => v.length > 0);
console.log('Escaped variants:', escapedVariants);

const conditions = [];
const seen = new Set();
for (const v of escapedVariants) {
  if (seen.has(v)) continue;
  seen.add(v);
  const pattern = `%${v}%`;
  conditions.push(`name.ilike.${pattern}`);
  conditions.push(`name_kana.ilike.${pattern}`);
}

console.log('Final conditions:', conditions);
console.log('OR clause:', conditions.join(','));