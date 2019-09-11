import { parseBIP44Path } from '../accountUtils';

describe('accountUtils', () => {
    it('accountUtils.parseBIP44Path', () => {
        expect(parseBIP44Path("m/84'/0'/0'/1/0")).toEqual({
            purpose: "84'",
            coinType: "0'",
            account: "0'",
            change: '1',
            addrIndex: '0',
        });
        expect(parseBIP44Path("m/44'/0'/0'/0/2")).toEqual({
            purpose: "44'",
            coinType: "0'",
            account: "0'",
            change: '0',
            addrIndex: '2',
        });
        expect(parseBIP44Path("m/44'/0'/0'/0/48")).toEqual({
            purpose: "44'",
            coinType: "0'",
            account: "0'",
            change: '0',
            addrIndex: '48',
        });
        expect(parseBIP44Path("m/44'/133'/0'/0/0")).toEqual({
            purpose: "44'",
            coinType: "133'",
            account: "0'",
            change: '0',
            addrIndex: '0',
        });
    });

    it('parseBIP44Path: invalid format', () => {
        expect(parseBIP44Path("m/84'/0'/0'/1/")).toEqual(null);
    });
});
