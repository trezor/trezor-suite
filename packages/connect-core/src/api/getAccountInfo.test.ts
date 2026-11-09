import type {
    BundledParams,
    GetAccountInfo as GetAccountInfoParams,
    Params,
} from '@trezor/connect-common';

import { default as GetAccountInfo } from './getAccountInfo';
import { initBlockchain } from '../backend/BlockchainLink';

jest.mock('../backend/BlockchainLink', () => ({
    assertBackendSupported: jest.fn(),
    initBlockchain: jest.fn(),
}));

const DESCRIPTOR = 'GBSXTBPFJOJ64NSYRFE2F6P6TPMMSD45KQZH5TEWIBEAHICY6IZVGCET';
const CONTRACT = 'CBI7UCH5KGSVQRO5H4SUCZUTZABCITZLRHQQZTWL2TK4RZ72TAR6IHRV';

// The same taproot descriptor in the firmware `h` form and in the canonical apostrophe form.
const TAPROOT_DESCRIPTOR_WITH_H =
    '[5c9e228d/86h/0h/0h]tpubDCpt6oCoUgcQEPBUnZS4pijgjNySRDaJH8FyztXHnjxCH3z8jjHKGpX3zwtNs1U8ThRDb8ZbnAnZWc1KNLQx8fasQnk3f9Vaqu3JJXcYCF';
const TAPROOT_DESCRIPTOR_CANONICAL =
    "[5c9e228d/86'/0'/0']tpubDCpt6oCoUgcQEPBUnZS4pijgjNySRDaJH8FyztXHnjxCH3z8jjHKGpX3zwtNs1U8ThRDb8ZbnAnZWc1KNLQx8fasQnk3f9Vaqu3JJXcYCF";

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

    // Blockbook rejects the `h` form (#16748), while the SDK contract is that the returned
    // descriptor matches the requested one, so the two forms must not be mixed up.
    it('sends the canonical descriptor to the backend and returns the requested form', async () => {
        const getAccountInfo = jest
            .fn()
            .mockResolvedValue({ descriptor: TAPROOT_DESCRIPTOR_CANONICAL, empty: true });
        jest.mocked(initBlockchain).mockResolvedValue({ getAccountInfo } as any);

        const account = await new GetAccountInfo({
            payload: {
                method: 'getAccountInfo',
                coin: 'test',
                descriptor: TAPROOT_DESCRIPTOR_WITH_H,
                details: 'basic',
            },
        }).run({ sendCoreMessage: jest.fn() } as any);

        expect(getAccountInfo).toHaveBeenCalledWith(
            expect.objectContaining({ descriptor: TAPROOT_DESCRIPTOR_CANONICAL }),
        );
        expect(account).toMatchObject({ descriptor: TAPROOT_DESCRIPTOR_WITH_H });
    });
});

describe('GetAccountInfo device use', () => {
    // The device has to be acquired for the path-only batch whatever its position in the bundle;
    // without `useDevice` that batch resolves to `null` with a "Device not found" error.
    it('uses the device when an earlier batch has a path without a descriptor', () => {
        const method = createMethodWith({
            bundle: [
                { coin: 'btc', path: "m/84'/0'/0'" },
                {
                    coin: 'btc',
                    path: "m/84'/0'/1'",
                    descriptor:
                        'xpub6BiVtCpG9fQPxnPmHXG8PhtzQdWC2Su4qWu6XW9tpWFYhxydCLJGrWBJZ5H6qTAHdPQ7pQhtpjiYZVZARo14qHiay2fvrX996oEP42u8wZy',
                },
            ],
        });

        // `useUi` is derived from `useDevice`, so it follows.
        expect(method.useDevice).toBe(true);
        expect(method.useDeviceState).toBe(true);
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

    // Unlike getAddress and getPublicKey, the path is not checked against the coin.
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
