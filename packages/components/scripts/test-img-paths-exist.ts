/* eslint-disable no-console */

import fs from 'fs';
import path from 'path';

import { PNG_IMAGES, SVG_IMAGES } from '../src/components/Image/images';

const imageDir = path.join(__dirname, '../../suite-data/files/images');

const notFound: string[] = [];
const caseMismatch: string[] = [];

function fileExistsWithCaseSync(filepath: string) {
    const dir = path.dirname(filepath);
    if (dir === path.dirname(dir)) {
        return true;
    }
    const filenames = fs.readdirSync(dir);
    if (filenames.indexOf(path.basename(filepath)) === -1) {
        return false;
    }

    return fileExistsWithCaseSync(dir);
}

const checkImgSet = (imgSet: Record<string, string>, ext: string) => {
    for (const value of Object.values(imgSet)) {
        const imagePath = path.join(imageDir, ext, value);

        const caseMatches = fileExistsWithCaseSync(imagePath);
        const fileExists = fs.existsSync(imagePath);

        if (!fileExists) {
            notFound.push(imagePath);
        } else if (!caseMatches) {
            caseMismatch.push(imagePath);
        }
    }
};

checkImgSet(PNG_IMAGES, 'png');
checkImgSet(SVG_IMAGES, 'svg');

console.log('=== NOT FOUND ===');
console.log(notFound);

console.log('=== CASE MISMATCH ===');
console.log(caseMismatch);

if (notFound.length > 0 || caseMismatch.length > 0) {
    console.error('Image check failed');
    process.exit(1);
}
