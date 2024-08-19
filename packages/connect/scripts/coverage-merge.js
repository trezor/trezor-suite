const path = require('path');
const fs = require('fs');
const process = require('process');
const child_process = require('child_process');

const combinedCoverageDirPath = path.resolve(__dirname, '../coverage/combined');

// create combined dir
fs.mkdirSync(combinedCoverageDirPath, { recursive: true });

// merge files in the combined directory using nyc merge
const cmd = [
    'nyc',
    'merge',
    path.join(__dirname, '../coverage/merged'),
    path.join(combinedCoverageDirPath, 'coverage-final.json'),
];

const res = child_process.spawnSync('npx', [...cmd], {
    encoding: 'utf-8',
});

if (process.env.CI) {
    const coverageFinalPath = path.join(combinedCoverageDirPath, 'coverage-final.json');
    let coverageFinal = fs.readFileSync(coverageFinalPath, 'utf-8');
    coverageFinal = coverageFinal.replaceAll('/trezor-suite', '.');
    fs.writeFileSync(coverageFinalPath, coverageFinal);

    // print first 20 lines of the file with replaced paths
    console.log(coverageFinal.split('\n').slice(0, 20).join('\n'));
}

const cmd2 = [
    'nyc',
    'report',
    '-t',
    combinedCoverageDirPath,
    '--report-dir',
    path.join(__dirname, '../coverage/merged-report'),
    '--reporter=html',
    '--reporter=lcov',
    '--exclude-after-remap=false',
];

const res2 = child_process.spawnSync('npx', [...cmd2], {
    encoding: 'utf-8',
});

console.log(res2);
