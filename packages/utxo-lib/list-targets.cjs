#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const reportPath = path.join(__dirname, 'reports/mutation/mutation.json');
if (!fs.existsSync(reportPath)) {
    console.error('Report missing. Run yarn test:mutation first.');
    process.exit(1);
}
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const buckets = { NoCoverage: [], Survived: [], Timeout: [] };
for (const [filePath, fileResult] of Object.entries(report.files)) {
    for (const m of fileResult.mutants) {
        if (buckets[m.status])
            buckets[m.status].push({
                file: filePath,
                line: m.location.start.line,
                col: m.location.start.column,
                mutator: m.mutatorName,
                replacement: m.replacement,
                id: m.id,
            });
    }
}
const total = Object.values(report.files).reduce((s, f) => s + f.mutants.length, 0);
const killed = total - buckets.NoCoverage.length - buckets.Survived.length - buckets.Timeout.length;
console.log(`Mutation status: ${killed} killed, ${buckets.Survived.length} survived, ` +
            `${buckets.NoCoverage.length} no-coverage, ${buckets.Timeout.length} timeout`);
console.log(`\n=== Priority 1: NoCoverage (write ANY test touching this code) — top 20 ===`);
for (const m of buckets.NoCoverage.slice(0, 20))
    console.log(`  ${m.file}:${m.line}:${m.col}  [${m.mutator}]  → ${m.replacement}`);
console.log(`\n=== Priority 2: Survived (existing tests pass — strengthen assertions) — top 20 ===`);
for (const m of buckets.Survived.slice(0, 20))
    console.log(`  ${m.file}:${m.line}:${m.col}  [${m.mutator}]  → ${m.replacement}`);
