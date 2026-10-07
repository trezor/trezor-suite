import type {
    BundledParams,
    GetAccountInfo as GetAccountInfoParams,
    Params,
} from '@trezor/connect-common';

import { default as GetAccountInfo } from './getAccountInfo';

const DESCRIPTOR = 'GBSXTBPFJOJ64NSYRFE2F6P6TPMMSD45KQZH5TEWIBEAHICY6IZVGCET';
const CONTRACT = 'CBI7UCH5KGSVQRO5H4SUCZUTZABCITZLRHQQZTWL2TK4RZ72TAR6IHRV';

const createMethod = (stellarContractTokens?: string[]) =>
    new GetAccountInfo({
        payload: {
            method: 'getAccountInfo',
            coin: 'xlm',
            descriptor: DESCRIPTOR,
            details: 'basic',
            ...(stellarContractTokens ? { stellarContractTokens } : {}),
        },
    });

const createMethodWith = (
    params: Params<GetAccountInfoParams> | BundledParams<GetAccountInfoParams>,
) => new GetAccountInfo({ payload: { method: 'getAccountInfo', ...params } });

describe(GetAccountInfo.name, () => {
    // Without `allowEmpty` an account watching nothing failed validation and never refreshed.
    it('accepts an empty watch list', () => {
        expect(() => createMethod([])).not.toThrow();
    });

    it('accepts a populated watch list', () => {
        const method = createMethod([CONTRACT]);

        // `params` is protected; element access is how a test may read it.
        expect(method['params'][0]!.stellarContractTokens).toEqual([CONTRACT]);
    });

    it('accepts an omitted watch list', () => {
        expect(() => createMethod()).not.toThrow();
    });
});

describe('GetAccountInfo path and coin', () => {
    it.each<GetAccountInfoParams>([
        { coin: 'btc', path: "m/84'/0'/0'" },
        { coin: 'test', path: "m/84'/1'/0'" },
        { coin: 'eth', path: "m/44'/60'/0'/0/0" },
        { coin: 'etc', path: "m/44'/61'/0'/0/0" },
        { coin: 'tsep', path: "m/44'/1'/0'/0/0" },
        { coin: 'txrp', path: "m/44'/144'/0'/0/0" },
    ])('accepts $coin with path $path', params => {
        expect(createMethodWith(params).requiredPermissions).toEqual([
            { permission: 'read_account_info', coin: params.coin },
        ]);
    });

    // Unlike getAddress and getPublicKey, the path is not checked against the coin, so the device
    // derives a key of another coin under the permission and confirmation of `coin`.
    it.each<GetAccountInfoParams>([
        { coin: 'btc', path: "m/44'/60'/0'" },
        { coin: 'test', path: "m/84'/0'/0'" },
        { coin: 'eth', path: "m/44'/61'/0'/0/0" },
    ])('accepts $coin with path $path of another coin', params => {
        expect(() => createMethodWith(params)).not.toThrow();
    });

    // With a descriptor the device derives nothing, so the path is only a response field and a
    // confirmation label and the coin type is not checked.
    it('accepts a path of another coin next to a descriptor', () => {
        expect(() =>
            createMethodWith({
                coin: 'btc',
                descriptor:
                    'xpub6BiVtCpG9fQPxnPmHXG8PhtzQdWC2Su4qWu6XW9tpWFYhxydCLJGrWBJZ5H6qTAHdPQ7pQhtpjiYZVZARo14qHiay2fvrX996oEP42u8wZy',
                path: "m/44'/60'/0'",
            }),
        ).not.toThrow();
    });

    it('accepts a bundle in which one path is of another coin', () => {
        expect(() =>
            createMethodWith({
                bundle: [
                    { coin: 'btc', path: "m/84'/0'/0'" },
                    { coin: 'btc', path: "m/44'/195'/0'" },
                ],
            }),
        ).not.toThrow();
    });
});
