import { DEFAULT_ACCOUNT_SYNC_INTERVAL } from '@trezor/network-module-suite-common-types';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { buildCustomEvmNetworkConfig, createCustomEvmNetworkModule } from './customEvmNetwork';
import { mockCustomEvmNetworkConfigParams } from '../mocks/mockCustomEvmNetworkConfigParams';

const params = mockCustomEvmNetworkConfigParams({
    explorerUrl: 'https://explorer.custom.example/',
});
const symbol = asNetworkSymbol('evm4242');

describe(buildCustomEvmNetworkConfig.name, () => {
    it('builds an RPC-only Ethereum network from the definition', () => {
        const config = buildCustomEvmNetworkConfig(params);

        expect(config).toEqual(
            expect.objectContaining({
                networkType: 'ethereum',
                bip43Path: "m/44'/60'/0'/0/i",
                decimals: 18,
                chainId: 4242,
                name: 'Custom Chain',
                displaySymbol: 'CST',
                testnet: false,
                caipId: 'eip155:4242',
                accountTypes: {
                    ledger: expect.objectContaining({
                        bip43Path: "m/44'/60'/i'/0/0",
                        isDebugOnlyAccountType: true,
                    }),
                    legacy: expect.objectContaining({
                        bip43Path: "m/44'/60'/0'/i",
                        isDebugOnlyAccountType: true,
                    }),
                },
                yieldXyzId: null,
                protocols: [],
                features: ['tokens', 'eip1559', 'rbf', 'sign-verify'],
                backendOptions: [{ type: 'evm-rpc' }],
            }),
        );
        expect(config.coingeckoId).toBeUndefined();
    });

    it('derives explorer paths without a doubled slash', () => {
        expect(buildCustomEvmNetworkConfig(params).explorer).toEqual({
            base: 'https://explorer.custom.example',
            tx: 'https://explorer.custom.example/tx/',
            address: 'https://explorer.custom.example/address/',
            nft: 'https://explorer.custom.example/nft/',
        });
    });

    it.each([undefined, ''])('rejects a missing explorer URL (%p)', explorerUrl => {
        expect(() =>
            buildCustomEvmNetworkConfig({ ...params, explorerUrl: explorerUrl as string }),
        ).toThrow('has no explorer URL');
    });

    it('keeps the testnet flag', () => {
        expect(buildCustomEvmNetworkConfig({ ...params, testnet: true }).testnet).toBe(true);
    });
});

describe(createCustomEvmNetworkModule.name, () => {
    const config = buildCustomEvmNetworkConfig(params);
    const networkModule = createCustomEvmNetworkModule({ symbol, config });

    it('supports only its own symbol and serves its config', () => {
        expect(networkModule.getSupportedNetworks()).toEqual([symbol]);
        expect(networkModule.getNetworkConfig(symbol)).toBe(config);
    });

    it('has no bundled icon, so another network logo is never shown', () => {
        expect(networkModule.icon.getIcons(symbol)).toEqual({ coin: '', network: '' });
    });

    it('does not throw when asked for the sync interval', () => {
        expect(networkModule.getAccountSyncInterval(symbol)).toBe(DEFAULT_ACCOUNT_SYNC_INTERVAL);
    });

    it('validates addresses like any other Ethereum network', () => {
        const { addressValidator } = networkModule;

        expect(
            addressValidator.isAddressValid(symbol, '0xE37c0D48d68da5c5b14E5c1a9f1CFE802776D9FF'),
        ).toBe(true);
        expect(
            addressValidator.isAddressValid(symbol, '0xE37c0D48d68da5c5b14E5c1a9f1CFE802776D9fF'),
        ).toBe(false);
        expect(addressValidator.isAddressValid(symbol, 'not-an-address')).toBe(false);
    });
});
