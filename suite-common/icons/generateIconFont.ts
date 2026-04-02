/* eslint-disable no-console */
// eslint-disable-next-line import/no-extraneous-dependencies
import chalk from 'chalk';
// eslint-disable-next-line import/no-extraneous-dependencies
import { FontAssetType, OtherAssetType, generateFonts } from 'fantasticon';
import fs, { constants } from 'fs';
import path from 'path';

import { MOBILE_ICON_FONT_NAME } from './src/constants';
import { type IconName as AllAvailableIcons } from './src/icons';

const usedIcons = [
    'arrowBendRightUp',
    'arrowDown',
    'arrowDown',
    'arrowDownLeft',
    'arrowLineDown',
    'arrowLineUp',
    'arrowLineUpRight',
    'arrowLeft',
    'arrowRight',
    'arrowsCounterClockwise',
    'arrowsClockwise',
    'arrowsDownUp',
    'arrowsLeftRight',
    'arrowSquareOut',
    'arrowUp',
    'arrowUpRight',
    'arrowUpRight',
    'arrowURightDown',
    'arrowUUpLeft',
    'arrowCounterClockwise',
    'article',
    'atom',
    'backspace',
    'eject',
    'ejectSimple',
    'bank',
    'bluetooth',
    'bluetoothConnected',
    'bluetoothSlash',
    'bookmarkSimple',
    'browsers',
    'bugBeetle',
    'cableUsbC',
    'calendarBlank',
    'calendar',
    'cameraSlash',
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
    'chatCircle',
    'chatsTeardrop',
    'check',
    'checkCircle',
    'checkCircleFilled',
    'checks',
    'circleDashed',
    'clockClockwise',
    'clock',
    'code',
    'coin',
    'coins',
    'coinSlash',
    'coinVerticalCheck',
    'copy',
    'currencyBtc',
    'cpu',
    'clipboard',
    'database',
    'detective',
    'deviceMobileCamera',
    'discover',
    'discoverFilled',
    'everstakeLogo',
    'eye',
    'eyeSlash',
    'facebookLogo',
    'fileTxt',
    'filePdf',
    'fingerprint',
    'fingerprintSimple',
    'flag',
    'flagCheckered',
    'gasPump',
    'gear',
    'gearFilled',
    'githubLogo',
    'graph',
    'handPalm',
    'handWaving',
    'heart',
    'hourglass',
    'house',
    'houseFilled',
    'image',
    'info',
    'instagramLogo',
    'lifebuoy',
    'lightbulb',
    'link',
    'linkBreak',
    'lock',
    'magnifyingGlass',
    'minus',
    'newspaper',
    'package',
    'palette',
    'password',
    'pencil',
    'pencilSimple',
    'pencilSimpleLine',
    'piggyBank',
    'piggyBankFilled',
    'pictureFrame',
    'plugs',
    'plus',
    'plusCircle',
    'power',
    'prohibit',
    'qrCode',
    'question',
    'questionSimple',
    'scroll',
    'seal',
    'selectionSlash',
    'shareNetwork',
    'shieldCheck',
    'shield',
    'shieldWarning',
    'shuffle',
    'sliders',
    'slidersHorizontal',
    'spinner',
    'spinnerGap',
    'stack',
    'star',
    'smiley',
    'starFilled',
    'starFour',
    'surfaceProtection',
    'swap',
    'textAa',
    'tag',
    'tiktokLogo',
    'timer',
    'translate',
    'trash',
    'trashSimple',
    'treeStructure',
    'trendUp',
    'trezorBackup',
    'trezorDevices',
    'trezorLogo',
    'trezorModelOne',
    'trezorModelOneFilled',
    'trezorModelT',
    'trezorModelTFilled',
    'trezorPassword',
    'trezorSafe3',
    'trezorSafe3Filled',
    'trezorSafe5',
    'trezorSafe5Filled',
    'trezorSafe7',
    'twitterLogo',
    'users',
    'wallet',
    'walletConnect',
    'warning',
    'warningCircle',
    'warningOctagon',
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
