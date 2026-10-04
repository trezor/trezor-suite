import {
    type FirmwareVersion,
    getDestinationOutputScriptType,
    getDiscoverableAccountTypes,
    isAffectedBySegwitAmountVulnerability,
    isDestinationFormatSupported,
    isSupportedFirmware,
    showsAddressInProportionalFont,
    wipesAfterWrongPinAttempts,
} from './firmwareSupport';

describe('isSupportedFirmware', () => {
    it.each<[FirmwareVersion, boolean]>([
        [[1, 3, 5], false],
        [[1, 3, 6], true],
        [[1, 4, 0], true],
        [[1, 5, 2], true],
        [[1, 6, 0], true],
        [[1, 6, 3], true],
        [[1, 6, 4], false],
        [[1, 7, 0], false],
        [[1, 12, 1], false],
        [[0, 9, 9], false],
        [[2, 3, 6], false],
    ])('firmware %j is supported: %s', (version, isSupported) => {
        expect(isSupportedFirmware(version)).toBe(isSupported);
    });
});

describe('getDiscoverableAccountTypes', () => {
    it.each<[FirmwareVersion, string[]]>([
        [[1, 3, 6], ['p2pkh']],
        [[1, 4, 2], ['p2pkh']],
        [[1, 5, 0], ['p2pkh']],
        [
            [1, 5, 1],
            ['p2pkh', 'p2sh'],
        ],
        [
            [1, 5, 2],
            ['p2pkh', 'p2sh'],
        ],
        [
            [1, 6, 0],
            ['p2pkh', 'p2sh', 'p2wpkh'],
        ],
        [
            [1, 6, 3],
            ['p2pkh', 'p2sh', 'p2wpkh'],
        ],
    ])('firmware %j discovers %j', (version, accountTypes) => {
        expect(getDiscoverableAccountTypes(version)).toEqual(accountTypes);
    });
});

describe('isDestinationFormatSupported', () => {
    it.each<[FirmwareVersion, boolean]>([
        [[1, 3, 6], false],
        [[1, 4, 2], false],
        [[1, 5, 0], false],
        [[1, 5, 1], false],
        [[1, 5, 2], false],
        [[1, 6, 0], true],
        [[1, 6, 1], true],
        [[1, 6, 3], true],
    ])('firmware %j pays to bech32: %s', (version, isSupported) => {
        expect(isDestinationFormatSupported(version, 'p2pkh')).toBe(true);
        expect(isDestinationFormatSupported(version, 'p2sh')).toBe(true);
        expect(isDestinationFormatSupported(version, 'bech32')).toBe(isSupported);
        expect(isDestinationFormatSupported(version, 'bech32m')).toBe(false);
    });
});

describe('getDestinationOutputScriptType', () => {
    it.each<[FirmwareVersion, string]>([
        [[1, 3, 6], 'PAYTOSCRIPTHASH'],
        [[1, 4, 2], 'PAYTOSCRIPTHASH'],
        [[1, 5, 0], 'PAYTOADDRESS'],
        [[1, 6, 3], 'PAYTOADDRESS'],
    ])('firmware %j types a P2SH destination as %s', (version, scriptType) => {
        expect(getDestinationOutputScriptType(version, 'p2sh')).toBe(scriptType);
        expect(getDestinationOutputScriptType(version, 'p2pkh')).toBe('PAYTOADDRESS');
    });

    it('types a bech32 destination as PAYTOADDRESS', () => {
        expect(getDestinationOutputScriptType([1, 6, 0], 'bech32')).toBe('PAYTOADDRESS');
    });
});

describe('firmware quirks', () => {
    it.each<[FirmwareVersion, boolean]>([
        [[1, 3, 6], false],
        [[1, 5, 0], false],
        [[1, 5, 1], true],
        [[1, 6, 3], true],
    ])('firmware %j has the SegWit amount vulnerability and the PIN wipe: %s', (version, has) => {
        expect(isAffectedBySegwitAmountVulnerability(version)).toBe(has);
        expect(wipesAfterWrongPinAttempts(version)).toBe(has);
    });

    it.each<[FirmwareVersion, boolean]>([
        [[1, 3, 6], true],
        [[1, 6, 0], true],
        [[1, 6, 1], false],
        [[1, 6, 3], false],
    ])('firmware %j shows addresses in a proportional font: %s', (version, isProportional) => {
        expect(showsAddressInProportionalFont(version)).toBe(isProportional);
    });
});
