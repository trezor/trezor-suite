import { FirmwareRelease } from '@trezor/connect';

import {
    parseFirmwareChangelog,
    ParseFirmwareChangelogParams,
    ParseFirmwareChangelogResult,
} from '../parseFirmwareChangelog';

const CHANGELOG_STRING =
    '* Replacement transaction signing for replace-by-fee.\n* Support for Output Descriptors export.\n* Show Ypub/Zpub correctly for multisig GetAddress.\n* Show amounts in mBTC, uBTC and sat denominations.';

const CHANGELOG_ARRAY = [
    '* Replacement transaction signing for replace-by-fee.',
    '* Support for Output Descriptors export.',
    '* Show Ypub/Zpub correctly for multisig GetAddress.',
    '* Show amounts in mBTC, uBTC and sat denominations.',
];

const EXPECTED_STRING =
    '* Replacement transaction signing for replace-by-fee.\n' +
    '* Support for Output Descriptors export.\n' +
    '* Show Ypub/Zpub correctly for multisig GetAddress.\n' +
    '* Show amounts in mBTC, uBTC and sat denominations.';

const releaseData: Omit<FirmwareRelease, 'changelog' | 'changelogBtcOnly'> = {
    required: false,
    version: [1, 9, 4],
    bootloader_version: [1, 8, 0],
    min_firmware_version: [1, 6, 2],
    min_bootloader_version: [1, 5, 0],
    url: 'firmware/1/trezor-1.9.4.bin',
    url_bitcoinonly: 'firmware/1/trezor-1.9.4-bitcoinonly.bin',
    fingerprint: '867017bd784cc4e9ce6f0875c61ea86f89b19380d54045c34608b85472998000',
    fingerprint_bitcoinonly: '3f73dfbcfc48f66c8814f6562524d81888230e0acd1c19b52b6e8772c6c67e7f',
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
            isBtcOnly: false,
        },

        result: { ...resultData, changelog: EXPECTED_STRING },
    },
    {
        description: 'return null when no release value is provided',
        input: {
            release: undefined,
            isBtcOnly: false,
        },
        result: null,
    },
    {
        description: 'parses BTC-only changelog from array of strings',
        input: {
            release: { ...releaseData, changelog: '', changelog_bitcoinonly: CHANGELOG_ARRAY },
            isBtcOnly: true,
        },
        result: { ...resultData, changelog: EXPECTED_STRING },
    },
    {
        description:
            'parses universal (old) changelog for BTC when the changelogBtcOnly is missing',
        input: {
            release: {
                ...releaseData,
                changelog: CHANGELOG_STRING,
                changelog_bitcoinonly: undefined,
            },
            isBtcOnly: true,
        },
        result: { ...resultData, changelog: EXPECTED_STRING },
    },
    {
        description:
            'results to null for whole changelog data, when empty string is provided (trimmed)',
        input: {
            release: { ...releaseData, changelog: '   \n   ', changelog_bitcoinonly: undefined },
            isBtcOnly: true,
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
