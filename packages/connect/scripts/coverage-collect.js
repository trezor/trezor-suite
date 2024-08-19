/**
 * script to collect partial artifacts from the matrix jobs in CI
 */

const fs = require('fs');
const process = require('process');
const child_process = require('child_process');
const path = require('path');

const coverageDir = path.join(__dirname, '../coverage');

if (!fs.existsSync(path.join(coverageDir, 'merged'))) {
    fs.mkdirSync(path.join(coverageDir, 'merged'));
}

const mergePartialFolders = dir => {
    // read content and print of all folders starting with coverage-
    const subdir = path.join(__dirname, '../coverage', dir || '');
    const coverageDirLs = fs.readdirSync(subdir);
    const coverageDirs = coverageDirLs.filter(dir => dir.startsWith('coverage-partial'));

    console.log('coverageDirLs', coverageDirLs);
    console.log('coverageDirs', coverageDirs);

    coverageDirs.forEach(dir => {
        const partialDirPath = path.join(subdir, `${dir}`);
        console.log('partialDirPath', partialDirPath);

        const partialDirContent = fs.readdirSync(partialDirPath);
        console.log('partialDirContent', partialDirContent);

        // read content of all dirs in partialDir folder
        partialDirContent.forEach(partialDir => {
            const partialDirContent = fs.copyFileSync(
                path.join(subdir, `${dir}/${partialDir}/coverage-final.json`),
                path.join(coverageDir, `merged/${partialDir}-coverage-final.json`),
            );
        });
    });

    // read merged dir
    const mergedDirContent = fs.readdirSync(path.join(coverageDir, 'merged'));
    console.log('ls -la ./packages/connect/coverage/merged', mergedDirContent);
};

console.log('process.env.CI', process.env.CI);

if (process.env.CI) {
    const coverageDirLs = fs.readdirSync(coverageDir);
    const coverageDirs = coverageDirLs.filter(dir => dir.startsWith('coverage-'));

    console.log('ci coverageDirsLs', coverageDirLs);

    coverageDirs.forEach(dir => {
        mergePartialFolders(dir);
    });
} else {
    mergePartialFolders();
}
