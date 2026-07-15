import { parseBIP44Path } from '../parseBIP44Path';

describe(parseBIP44Path.name, () => {
    it.each([
        [
            "m/84'/0'/0'/1/0",
            {
                purpose: "84'",
                coinType: "0'",
                account: "0'",
                change: '1',
                addrIndex: '0',
            },
        ],
        [
            "m/44'/0'/0'/0/2",
            {
                purpose: "44'",
                coinType: "0'",
                account: "0'",
                change: '0',
                addrIndex: '2',
            },
        ],
        [
            "m/44'/0'/0'/0/48",
            {
                purpose: "44'",
                coinType: "0'",
                account: "0'",
                change: '0',
                addrIndex: '48',
            },
        ],
        [
            "m/44'/133'/0'/0/0",
            {
                purpose: "44'",
                coinType: "133'",
                account: "0'",
                change: '0',
                addrIndex: '0',
            },
        ],
        ["m/84'/0'/0'/1/", null],
    ])('parses %s', (path, result) => {
        expect(parseBIP44Path(path)).toEqual(result);
    });
});
