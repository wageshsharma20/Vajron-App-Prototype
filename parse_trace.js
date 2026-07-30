const fs = require('fs');
const data = fs.readFileSync('trace_dir/trace.json', 'utf-8');
const events = JSON.parse(data);
const sourceFiles = events.filter(e => e.name === 'checkSourceFile').map(e => e.args?.path);
console.log('Last 10 source files checked:');
console.log(sourceFiles.slice(-10).join('\n'));
