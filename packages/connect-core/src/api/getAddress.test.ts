import type { CoinSymbol } from '@trezor/connect-common';

import GetAddress from './getAddress';

type GetAddressParams = { path: string; coin?: CoinSymbol; crossChain?: boolean };

const createMethod = (params: GetAddressParams) =>
    new GetAddress({ payload: { method: 'getAddress', ...params } });

const createBundle = (bundle: GetAddressParams[]) =>
    new GetAddress({ payload: { method: 'getAddress', bundle } });

describe('GetAddress permissions', () => {
    it('requires read_address for the coin of the path', () => {
        const method = createMethod({ coin: 'test', path: "m/84'/1'/0'/0/0" });
        expect(method.requiredPermissions).toEqual([{ permission: 'read_address', coin: 'test' }]);
        expect(method.info).toBe('Export Testnet address');
    });

    it.each([
        ['Litecoin', "m/84'/2'/0'/0/0", 'ltc'],
        ['Bitcoin Cash', "m/44'/145'/0'/0/0", 'bch'],
        ['Ethereum', "m/44'/60'/0'/0/0", 'eth'],
        ['Tron', "m/44'/195'/0'/0/0", 'trx'],
        ['Solana', "m/44'/501'/0'/0'", 'btc'],
        ['coin type 1', "m/84'/1'/0'/0/0", 'btc'],
        ['a non-hardened second element', "m/45'/2/0/0", 'btc'],
        ['no second element', 'm/0', 'btc'],
    ])('requires read_address for a crossChain path of %s', (_, path, coin) => {
        expect(createMethod({ coin: 'btc', path, crossChain: true }).requiredPermissions).toEqual([
            { permission: 'read_address', coin },
        ]);
    });

    it('titles a crossChain call by its coin and the network of its path', () => {
        const getInfo = (path: string) =>
            createMethod({ coin: 'btc', path, crossChain: true }).info;

        expect(getInfo("m/44'/60'/0'/0/0")).toBe('Export Bitcoin address (Ethereum path)');
        expect(getInfo("m/44'/145'/0'/0/0")).toBe('Export Bitcoin address (Bitcoin Cash path)');
        expect(getInfo("m/44'/9999'/0'/0/0")).toBe('Export Bitcoin address');
    });

    it('titles a bundle by its network', () => {
        const bitcoinPath = { coin: 'btc', path: "m/84'/0'/0'/0/0" } as const;
        const ethereumPath = { coin: 'btc', path: "m/44'/60'/0'/0/0", crossChain: true } as const;

        expect(createBundle([bitcoinPath, bitcoinPath]).info).toBe(
            'Export multiple Bitcoin addresses',
        );

        const crossChainBundle = createBundle([ethereumPath, ethereumPath]);
        expect(crossChainBundle.requiredPermissions).toEqual([
            { permission: 'read_address', coin: 'eth' },
        ]);
        expect(crossChainBundle.info).toBe('Export multiple Bitcoin addresses (Ethereum path)');

        const mixedBundle = createBundle([bitcoinPath, ethereumPath]);
        expect(mixedBundle.requiredPermissions).toEqual([
            { permission: 'read_address', coin: 'btc' },
            { permission: 'read_address', coin: 'eth' },
        ]);
        expect(mixedBundle.info).toBe('Export multiple addresses');
    });
});
