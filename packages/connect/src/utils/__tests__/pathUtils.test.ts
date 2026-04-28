import {
    getAccountType,
    getHDPath,
    getOutputScriptType,
    getScriptType,
    toHardened,
    validatePath,
} from '../pathUtils';

describe('utils/pathUtils', () => {
    it('getScriptType', () => {
        expect(getScriptType(getHDPath("m/44'/1'/0'"))).toEqual('SPENDADDRESS');
        expect(getScriptType(getHDPath("m/49'/1'/0'"))).toEqual('SPENDP2SHWITNESS');
        expect(getScriptType(getHDPath("m/84'/1'/0'"))).toEqual('SPENDWITNESS');
        expect(getScriptType(getHDPath("m/86'/1'/0'"))).toEqual('SPENDTAPROOT');
        expect(getScriptType(getHDPath("m/10025'/1'/0'/1'"))).toEqual('SPENDTAPROOT'); // slip-25
        // bip48
        expect(getScriptType(getHDPath("m/48'/1'/0'"))).toEqual(undefined); // not bip48 path SPENDADDRESS will be used
        expect(getScriptType(getHDPath("m/48'/1'/0'/0'"))).toEqual('SPENDMULTISIG');
        expect(getScriptType(getHDPath("m/48'/1'/0'/1'"))).toEqual('SPENDP2SHWITNESS');
        expect(getScriptType(getHDPath("m/48'/1'/0'/2'"))).toEqual('SPENDWITNESS');

        // defaults
        expect(getScriptType([])).toEqual(undefined);
        expect(getScriptType([0])).toEqual(undefined);
    });

    it('getOutputScriptType', () => {
        expect(getOutputScriptType(getHDPath("m/44'/1'/0'"))).toEqual('PAYTOADDRESS');
        expect(getOutputScriptType(getHDPath("m/49'/1'/0'"))).toEqual('PAYTOP2SHWITNESS');
        expect(getOutputScriptType(getHDPath("m/84'/1'/0'"))).toEqual('PAYTOWITNESS');
        expect(getOutputScriptType(getHDPath("m/86'/1'/0'"))).toEqual('PAYTOTAPROOT');
        expect(getOutputScriptType(getHDPath("m/10025'/1'/0'/1'"))).toEqual('PAYTOTAPROOT'); // slip-25
        // bip48
        expect(getOutputScriptType(getHDPath("m/48'/1'/0'"))).toEqual(undefined); // not bip48 path SPENDADDRESS will be used
        expect(getOutputScriptType(getHDPath("m/48'/1'/0'/0'"))).toEqual('PAYTOMULTISIG');
        expect(getOutputScriptType(getHDPath("m/48'/1'/0'/1'"))).toEqual('PAYTOP2SHWITNESS');
        expect(getOutputScriptType(getHDPath("m/48'/1'/0'/2'"))).toEqual('PAYTOWITNESS');

        // compatibility for Casa - allow an unhardened 49 path to use PAYTOP2SHWITNESS
        expect(getOutputScriptType(getHDPath("m/49/1'/0'"))).toEqual('PAYTOP2SHWITNESS');
        // defaults
        expect(getOutputScriptType([])).toEqual(undefined);
        expect(getOutputScriptType([0])).toEqual(undefined);
    });

    it('getAccountType', () => {
        expect(getAccountType(getHDPath("m/44'/1'/0'"))).toEqual('p2pkh');
        expect(getAccountType(getHDPath("m/48'/1'/0'"))).toEqual('p2pkh'); // NOTE: missing "multisig" account type
        expect(getAccountType(getHDPath("m/49'/1'/0'"))).toEqual('p2sh');
        expect(getAccountType(getHDPath("m/84'/1'/0'"))).toEqual('p2wpkh');
        expect(getAccountType(getHDPath("m/86'/1'/0'"))).toEqual('p2tr');
        expect(getAccountType(getHDPath("m/10025'/1'/0'/1'"))).toEqual('p2tr'); // NOTE: slip25 should be p2tr type

        // defaults
        expect(getAccountType([])).toEqual('p2pkh');
        expect(getAccountType([0])).toEqual('p2pkh');
        expect(getAccountType(undefined)).toEqual('p2pkh');
    });

    describe('validatePath', () => {
        it('parses string path with hardened apostrophe', () => {
            expect(validatePath("m/44'/0'/0'")).toEqual([
                toHardened(44),
                toHardened(0),
                toHardened(0),
            ]);
            expect(validatePath("m/44'/0'/0'/0/0")).toEqual([
                toHardened(44),
                toHardened(0),
                toHardened(0),
                0,
                0,
            ]);
        });

        it('passes number[] path through unchanged', () => {
            const path = [toHardened(44), toHardened(0), toHardened(0), 0, 0];
            expect(validatePath(path)).toEqual(path);
        });

        it('returns empty array for "m" or []', () => {
            expect(validatePath('m')).toEqual([]);
            expect(validatePath([])).toEqual([]);
        });

        it('throws for malformed string path', () => {
            expect(() => validatePath('not-a-path')).toThrow(/Not a valid path/);
            expect(() => validatePath("m/abc'")).toThrow(/Not a valid path/);
        });

        it('throws for negative values', () => {
            expect(() => validatePath([-1, 0])).toThrow(/Path cannot contain negative values/);
            expect(() => validatePath("m/-1'/0'")).toThrow(/Path cannot contain negative values/);
        });

        it('throws for NaN inside number[]', () => {
            expect(() => validatePath([NaN, 0, 0])).toThrow(/Not a valid path/);
        });

        it('throws when path is shorter than required length', () => {
            expect(() => validatePath([0, 1], 3)).toThrow(/Not a valid path/);
            expect(() => validatePath("m/44'", 3)).toThrow(/Not a valid path/);
        });

        it('returns first 3 elements when base flag is set', () => {
            const path = [toHardened(44), toHardened(0), toHardened(0), 0, 0];
            expect(validatePath(path, 0, true)).toEqual([
                toHardened(44),
                toHardened(0),
                toHardened(0),
            ]);
        });
    });
});
