// Simple Node.js script to debug the variant expansion issue
const fs = require('fs');
const path = require('path');

// Read the kana-convert.ts file and eval the functions we need
const kanaConvertPath = path.join(__dirname, 'lib/utils/kana-convert.ts');
const content = fs.readFileSync(kanaConvertPath, 'utf8');

// Extract the functions we need (this is a hack but should work for debugging)
eval(`
  function kataToHira(s) {
    return s.replace(/[\\u30A1-\\u30F6]/g, (c) =>
      String.fromCharCode(c.charCodeAt(0) - 0x60)
    );
  }

  function hiraToKata(s) {
    return s.replace(/[\\u3041-\\u3096]/g, (c) =>
      String.fromCharCode(c.charCodeAt(0) + 0x60)
    );
  }

  function normalize(s) {
    return s.toLowerCase().trim(); // Simplified for debugging
  }

  function expandQueryVariants(q) {
    const base = normalize(q);
    if (!base) return [];

    const kanaFamily = new Set([
      base,
      kataToHira(base),
      hiraToKata(base),
    ]);

    return Array.from(kanaFamily).filter(v => v.length > 0);
  }
`);

function escapePattern(s) {
  return s.replace(/[%,()]/g, ' ').trim();
}

const query = 'ナポリタン';
console.log('=== Debug Query Variants ===');
console.log('Original query:', JSON.stringify(query));
console.log('Character codes:', Array.from(query).map(c => '0x' + c.codePointAt(0).toString(16)).join(' '));

const escaped = escapePattern(query);
console.log('After escapePattern:', JSON.stringify(escaped));

const variants = expandQueryVariants(escaped);
console.log('expandQueryVariants result:', variants);

const escapedVariants = variants.map(escapePattern).filter(v => v.length > 0);
console.log('After second escapePattern + filter:', escapedVariants);

const conditions = [];
const seen = new Set();
for (const v of escapedVariants) {
  if (seen.has(v)) continue;
  seen.add(v);
  const pattern = `%${v}%`;
  conditions.push(`name.ilike.${pattern}`);
  conditions.push(`name_kana.ilike.${pattern}`);
}

console.log('Final OR conditions:', conditions);
console.log('OR clause length:', conditions.length);

if (conditions.length === 0) {
  console.log('*** PROBLEM: No conditions generated! ***');
} else {
  console.log('OR clause:', conditions.join(','));
}