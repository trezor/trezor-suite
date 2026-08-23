import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';

import { getWrappedNativeYieldVaults } from './getWrappedNativeYieldVaults';

const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

type VaultFixtureParams = {
    network?: YieldDtoV2['network'];
    tokenAddress?: string;
    tokenSymbol?: string;
    underMaintenance?: boolean;
    deprecated?: boolean;
    enter?: boolean;
};

const createVaultFixture = ({
    network = 'ethereum',
    tokenAddress = WETH_ADDRESS,
    tokenSymbol = 'WETH',
    underMaintenance = false,
    deprecated = false,
    enter = true,
}: VaultFixtureParams) =>
    ({
        metadata: { name: 'Vault', underMaintenance, deprecated },
        network,
        status: { enter, exit: true },
        token: {
            symbol: tokenSymbol,
            network,
            name: tokenSymbol,
            decimals: 18,
            address: tokenAddress,
        },
    }) satisfies Pick<YieldDtoV2, 'metadata' | 'network' | 'status' | 'token'>;

describe('getWrappedNativeYieldVaults', () => {
    it('returns vaults taking the wrapped-native token of the network', () => {
        const wethVault = createVaultFixture({});
        const usdcVault = createVaultFixture({ tokenAddress: USDC_ADDRESS, tokenSymbol: 'USDC' });

        expect(
            getWrappedNativeYieldVaults({ vaults: [wethVault, usdcVault], networkSymbol: 'eth' }),
        ).toEqual([wethVault]);
    });

    it('filters out vaults on other networks', () => {
        const baseVault = createVaultFixture({ network: 'base' });

        expect(getWrappedNativeYieldVaults({ vaults: [baseVault], networkSymbol: 'eth' })).toEqual(
            [],
        );
    });

    it('filters out vaults under maintenance or deprecated', () => {
        const maintainedVault = createVaultFixture({ underMaintenance: true });
        const deprecatedVault = createVaultFixture({ deprecated: true });

        expect(
            getWrappedNativeYieldVaults({
                vaults: [maintainedVault, deprecatedVault],
                networkSymbol: 'eth',
            }),
        ).toEqual([]);
    });

    it('filters out vaults with deposits closed', () => {
        const closedVault = createVaultFixture({ enter: false });

        expect(
            getWrappedNativeYieldVaults({ vaults: [closedVault], networkSymbol: 'eth' }),
        ).toEqual([]);
    });

    it('returns an empty array when vaults are not loaded', () => {
        expect(getWrappedNativeYieldVaults({ vaults: undefined, networkSymbol: 'eth' })).toEqual(
            [],
        );
    });
});
