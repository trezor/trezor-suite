/**
 * This is just to test that we do not accidantely use two or more same files under different names
 * Of course not 100% bulletproof
 */

import * as fse from 'fs-extra';
import * as crypto from 'crypto';

// to simplify assertion
const getHash = (str: string) => crypto.createHash('md5').update(str).digest('hex');

const imagePaths = fse.readdirSync('files/images/svg');

console.log('checking total svgs:', imagePaths.length);

const hashMap = {};
let failed = false;

imagePaths.forEach((imgPath: string) => {
    const image = fse.readFileSync(`./files/images/svg/${imgPath}`, 'utf-8');
    // remove all linebreaks and whitespaces
    const hash = getHash(image.replace(/(\r\n|\n|\r|\s)/gm, ''));
    if (!hashMap[hash]) {
        hashMap[hash] = [];
    } else {
        failed = true;
    }
    hashMap[hash].push(imgPath);
});

if (failed) {
    console.log('Detected that project includes multiple same svgs, exiting with 1');
    console.log(Object.values(hashMap).filter((element: any) => element.length > 1));
    process.exit(1);
} else {
    console.log('No multiple same svgs found, exiting with 0');
    process.exit(0);
}
