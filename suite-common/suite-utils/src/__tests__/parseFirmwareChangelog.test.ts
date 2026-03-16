import { type FirmwareRelease } from '@trezor/device-utils';

import {
    type ParseFirmwareChangelogParams,
    type ParseFirmwareChangelogResult,
    parseFirmwareChangelog,
} from '../parseFirmwareChangelog';

const CHANGELOG_STRING =
    '* Replacement transaction signing for replace-by-fee.\n* Support for Output Descriptors export.\n* Show Ypub/Zpub correctly for multisig GetAddress.\n* Show amounts in mBTC, uBTC and sat denominations.';

const EXPECTED_STRING =
    '* Replacement transaction signing for replace-by-fee.\n' +
    '* Support for Output Descriptors export.\n' +
    '* Show Ypub/Zpub correctly for multisig GetAddress.\n' +
    '* Show amounts in mBTC, uBTC and sat denominations.';

const releaseData: Omit<FirmwareRelease, 'changelog'> = {
    required: false,
    version: [1, 9, 4],
    bootloader_version: [1, 8, 0],
    min_firmware_version: [1, 6, 2],
    min_bootloader_version: [1, 5, 0],
    url: 'firmware/1/trezor-1.9.4.bin',
    fingerprint: '867017bd784cc4e9ce6f0875c61ea86f89b19380d54045c34608b85472998000',
    translations: {
        'cs-CZ': 'firmware/translations/t1b1/translation-T2T1-cs-CZ-2.7.2.bin',
        'de-DE': 'firmware/translations/t1b1/translation-T2T1-de-DE-2.7.2.bin',
        'es-ES': 'firmware/translations/t1b1/translation-T2T1-es-ES-2.7.2.bin',
        'fr-FR': 'firmware/translations/t1b1/translation-T2T1-fr-FR-2.7.2.bin',
        'it-IT': 'firmware/translations/t1b1/translation-T2T1-it-IT-2.7.2.bin',
        'pt-BR': 'firmware/translations/t1b1/translation-T2T1-pt-BR-2.7.2.bin',
    },
    firmware_revision: 'fad9682201cf9289bba2adb66e6e07ed1cf78936',
};

const resultData = {
    versionString: '1.9.4',
};

const parseFirmwareChangelogFixture: Array<{
    description: string;
    input: ParseFirmwareChangelogParams;
    result: ParseFirmwareChangelogResult | null;
}> = [
    {
        description: 'parses release universal changelog passed as an string',
        input: {
            release: { ...releaseData, changelog: CHANGELOG_STRING },
        },

        result: { ...resultData, changelog: EXPECTED_STRING },
    },
    {
        description: 'return null when no release value is provided',
        input: {
            release: undefined,
        },
        result: null,
    },
    {
        description:
            'parses universal (old) changelog for BTC when the changelogBtcOnly is missing',
        input: {
            release: {
                ...releaseData,
                changelog: CHANGELOG_STRING,
            },
        },
        result: { ...resultData, changelog: EXPECTED_STRING },
    },
    {
        description:
            'results to null for whole changelog data, when empty string is provided (trimmed)',
        input: {
            release: { ...releaseData, changelog: '   \n   ' },
        },
        result: null,
    },
];

describe(parseFirmwareChangelog.name, () => {
    parseFirmwareChangelogFixture.forEach(row => {
        it(row.description, () => {
            expect(parseFirmwareChangelog(row.input)).toEqual(row.result);
        });
    });
});
