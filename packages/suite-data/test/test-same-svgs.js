/* eslint-disable @typescript-eslint/no-var-requires */

const fse = require('fs-extra');
const crypto = require('crypto');

// to simplify assertion
const getHash = str => {
    return crypto
        .createHash('md5')
        .update(str)
        .digest('hex');
};

const imagePaths = fse.readdirSync('packages/suite-data/files/images/svg');

console.log('checking total svgs:', imagePaths.length);

const hashMap = {};
let failed = false;

imagePaths.forEach(imgPath => {
    const image = fse.readFileSync(`packages/suite-data/files/images/svg/${imgPath}`, 'utf-8');
    const hash = getHash(image.trim());
    if (!hashMap[hash]) {
        hashMap[hash] = [];
    } else {
        failed = true;
    }
    hashMap[hash].push(imgPath);
});

if (failed) {
    console.log('Detected that project includes multiple same svgs, exiting with 1');
    console.log(Object.values(hashMap).filter(element => element.length > 1));
    process.exit(1);
} else {
    console.log('No multiple same svgs found, exiting with 0');
    process.exit(0);
};
