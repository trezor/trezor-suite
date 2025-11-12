import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { usedIcons as usedMobileIcons } from '@suite-common/icons/generateIconFont';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MOBILE_ICONS = new Set(usedMobileIcons);

const ICONS_DIR = path.join(__dirname, '../suite-common/icons/assets');
const CRYPTO_ICONS_DIR = path.join(__dirname, '../suite-common/icons/cryptoAssets/cryptoIcons');
const NETWORK_ICONS_DIR = path.join(__dirname, '../suite-common/icons/cryptoAssets/networkIcons');

// directories where icons could be used
const SEARCH_DIRS = [
    path.join(__dirname, '../packages/suite/src'),
    path.join(__dirname, '../packages/suite-web/src'),
    path.join(__dirname, '../packages/components/src'),
    path.join(__dirname, '../packages/suite-common'),
    path.join(__dirname, '../packages/suite-native'),
];

const getAllIconFiles = (dir, category) => {
    if (!fs.existsSync(dir)) return [];

    return fs
        .readdirSync(dir)
        .filter(file => file.endsWith('.svg'))
        .map(file => ({
            name: file.replace('.svg', ''),
            path: path.join(dir, file),
            size: fs.statSync(path.join(dir, file)).size,
            category,
        }));
};

const findIconUsages = iconName => {
    const escapedName = iconName.replace(/['"\\]/g, '\\$&');

    return SEARCH_DIRS.reduce((total, dir) => {
        if (!fs.existsSync(dir)) return total;

        try {
            const result = execSync(
                `grep -r "${escapedName}" "${dir}" --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" --include="*.mdx" --include="*.md" 2>/dev/null | wc -l`,
                { encoding: 'utf-8', shell: '/bin/bash' },
            );

            return total + (parseInt(result.trim()) || 0);
        } catch {
            return total;
        }
    }, 0);
};

const analyzeIcons = icons => {
    const results = [];

    console.log('Analyzing icons...\n');

    for (let i = 0; i < icons.length; i++) {
        const icon = icons[i];
        process.stdout.write(`\rProgress: ${i + 1}/${icons.length}`);

        results.push({
            ...icon,
            usages: findIconUsages(icon.name),
            isMobileIcon: MOBILE_ICONS.has(icon.name),
        });
    }

    console.log('\n');

    return results;
};

const deleteIcons = icons => {
    let deleted = 0;

    console.log(' Deleting unused icons...\n');

    for (let i = 0; i < icons.length; i++) {
        if (fs.existsSync(icons[i].path)) {
            try {
                fs.unlinkSync(icons[i].path);
                deleted++;

                if ((i + 1) % 50 === 0) {
                    process.stdout.write(`\rDeleted: ${i + 1}/${icons.length}`);
                }
            } catch (error) {
                console.error(`\n Failed to delete: ${icons[i].path} with error: ${error}`);
            }
        }
    }

    console.log('\n');

    return deleted;
};

const allIcons = [
    ...getAllIconFiles(ICONS_DIR, 'icons'),
    ...getAllIconFiles(CRYPTO_ICONS_DIR, 'cryptoIcons'),
    ...getAllIconFiles(NETWORK_ICONS_DIR, 'networkIcons'),
];

const results = analyzeIcons(allIcons);

const unusedIcons = results.filter(r => r.usages === 0 && !r.isMobileIcon);
const totalSize = allIcons.reduce((sum, icon) => sum + icon.size, 0);
const unusedSize = unusedIcons.reduce((sum, icon) => sum + icon.size, 0);

console.log(' Results:');
console.log(`Total icons: ${allIcons.length}`);
console.log(`Used: ${results.filter(r => r.usages > 0).length}`);
console.log(`Unused (deletable): ${unusedIcons.length}`);
console.log(
    `Savings: ${(unusedSize / 1024).toFixed(2)} KB (${((unusedSize / totalSize) * 100).toFixed(1)}%)\n`,
);

const deletedCount = deleteIcons(unusedIcons);

console.log(`Deleted ${deletedCount} icons`);
console.log(`Freed ${(unusedSize / 1024).toFixed(2)} KB\n`);
