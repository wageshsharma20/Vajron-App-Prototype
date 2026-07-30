const fs = require('fs');
const { spawnSync } = require('child_process');
const path = require('path');

const srcScreens = fs.readdirSync('src/screens').map(f => `src/screens/${f}`);
const srcComponents = fs.readdirSync('src/components').map(f => `src/components/${f}`);
const allFiles = [...srcScreens, ...srcComponents].filter(f => f.endsWith('.tsx'));

for (const file of allFiles) {
  const tsconfig = {
    compilerOptions: {
      target: "esnext",
      moduleResolution: "bundler",
      jsx: "react-native",
      esModuleInterop: true,
      skipLibCheck: true,
      strict: true
    },
    include: [file]
  };
  fs.writeFileSync('tsconfig.test.json', JSON.stringify(tsconfig, null, 2));
  const result = spawnSync('npx', ['tsc', '-p', 'tsconfig.test.json', '--noEmit'], { encoding: 'utf-8' });
  if (result.stderr && result.stderr.includes('Maximum call stack size exceeded')) {
    console.log('Failing file:', file);
  } else if (result.status === 1 && result.stdout && result.stdout.includes('Maximum call stack size exceeded')) {
    console.log('Failing file:', file);
  }
}
