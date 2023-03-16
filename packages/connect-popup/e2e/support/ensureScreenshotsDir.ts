import fs from 'fs';

export const ensureScreenshotsDir = (screenshotsPath: string) => {
    const path = screenshotsPath.replace(' ', '-');

    const dir = `./e2e/screenshots/${path}`;

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    return dir;
};
