import fs from 'fs';
let code = fs.readFileSync('index.tsx', 'utf8');
const startStr = 'const DetailPanel = ({';
const startIdx = code.indexOf(startStr);
const endStr = '// --- Main App ---';
const endIdx = code.indexOf(endStr);
if (startIdx !== -1 && endIdx !== -1) {
  code = `import { DetailPanel } from './src/components/DetailPanel';\n` + code.slice(0, startIdx) + code.slice(endIdx);
  fs.writeFileSync('index.tsx', code, 'utf8');
  console.log('Success');
} else {
  console.log('Fail: indices not found', startIdx, endIdx);
}
