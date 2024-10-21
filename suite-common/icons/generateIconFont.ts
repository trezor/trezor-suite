/* eslint-disable no-console */
// disable eslint import for this file because this whole file is using only devDependencies
// eslint-disable-next-line import/no-extraneous-dependencies
import { generateFonts, FontAssetType, OtherAssetType } from 'fantasticon';
import fs, { constants } from 'fs';
import path from 'path';
// eslint-disable-next-line import/no-extraneous-dependencies
import chalk from 'chalk';

import { type IconName as AllAvailableIcons } from './src/icons';
import { MOBILE_ICON_FONT_NAME } from './src/constants';

const usedIcons = [
    'arrowDown',
    'arrowDown',
    'arrowLineDown',
    'arrowLineUp',
    'arrowLineUpRight',
    'arrowRight',
    'arrowsCounterClockwise',
    'arrowSquareOut',
    'arrowUp',
    'arrowUpRight',
    'arrowUpRight',
    'arrowURightDown',
    'backspace',
    'bookmark',
    'bugBeetle',
    'calendar',
    'caretCircleRight',
    'caretDown',
    'caretDown',
    'caretDownFilled',
    'caretLeft',
    'caretRight',
    'caretUp',
    'caretUpDown',
    'caretUpFilled',
    'change',
    'check',
    'checkCircle',
    'checkCircleFilled',
    'checks',
    'circleDashed',
    'clockClockwise',
    'coins',
    'coinVerticalCheck',
    'copy',
    'database',
    'detective',
    'discover',
    'eye',
    'eyeSlash',
    'facebookLogo',
    'filePdf',
    'fingerprint',
    'fingerprintSimple',
    'flag',
    'flagCheckered',
    'gear',
    'githubLogo',
    'house',
    'image',
    'info',
    'lifebuoy',
    'lightbulb',
    'link',
    'lock',
    'magnifyingGlass',
    'palette',
    'password',
    'pencil',
    'pencilSimpleLine',
    'piggyBank',
    'piggyBankFilled',
    'plus',
    'plusCircle',
    'qrCode',
    'question',
    'question',
    'question',
    'question',
    'shareNetwork',
    'shieldWarning',
    'shuffle',
    'stack',
    'swap',
    'trashSimple',
    'treeStructure',
    'trezorLogo',
    'trezorModelOne',
    'trezorModelOneFilled',
    'trezorModelT',
    'trezorModelTFilled',
    'trezorSafe3',
    'trezorSafe3Filled',
    'trezorSafe5',
    'trezorSafe5Filled',
    'twitterLogo',
    'wallet',
    'warning',
    'warningCircle',
    'wifiSlash',
    'wifiX',
    'x',
    'xCircle',
] as const satisfies AllAvailableIcons[];

const tempAssetsDir = path.join(__dirname, 'assetsTemp');
const iconFontsMobileDir = path.join(__dirname, 'iconFontsMobile');

(async () => {
    console.log('Generating icon font for mobile...');

    fs.rmSync(tempAssetsDir, { recursive: true, force: true });
    fs.rmSync(iconFontsMobileDir, { recursive: true, force: true });

    fs.mkdirSync(tempAssetsDir);

    // copy used icons to assetsTemp
    usedIcons.forEach(icon => {
        fs.copyFileSync(
            `./assets/${icon}.svg`,
            `${tempAssetsDir}/${icon}.svg`,
            constants.COPYFILE_FICLONE,
        );
    });

    // create iconFontsMobile folder
    fs.mkdirSync('./iconFontsMobile');

    try {
        await generateFonts({
            inputDir: tempAssetsDir,
            outputDir: iconFontsMobileDir,
            name: MOBILE_ICON_FONT_NAME,
            fontTypes: [FontAssetType.TTF],
            assetTypes: [OtherAssetType.JSON],
            formatOptions: { json: { indent: 4 } },
            templates: {},
            pathOptions: {},
            codepoints: {},
            fontHeight: 300,
            round: undefined, // --
            descent: undefined, // Will use `svgicons2svgfont` defaults
            normalize: false, // --
            tag: 'i',
            prefix: 'icon',
            fontsUrl: undefined,
        });
    } catch (error) {
        console.error(error);
        process.exit(1);
    }

    // append newline to the end of the file to satisfy prettier
    fs.appendFileSync(`${iconFontsMobileDir}/${MOBILE_ICON_FONT_NAME}.json`, '\n');

    console.log(chalk.green('Icon font for mobile generated.'));
})();
