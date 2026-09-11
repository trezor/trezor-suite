import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import { toTokenSymbol } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { type ResolvedYieldFlowData } from '../src/yield/utils/getResolvedYieldFlowData';

export type FullyResolvedYieldFlowData = Extract<
    ResolvedYieldFlowData,
    { resolutionStatus: 'resolved' }
>;

const TOKEN_CONTRACT = '0x0000000000000000000000000000000000000001';
const RECEIPT_TOKEN_CONTRACT = '0x0000000000000000000000000000000000000002';

export const mockYieldVault = (overrides: Partial<YieldDtoV2> = {}): YieldDtoV2 => ({
    id: 'vault-id',
    network: 'ethereum',
    chainId: 1,
    providerId: 'morpho',
    metadata: {
        name: 'WETH Vault',
        underMaintenance: false,
        deprecated: false,
    },
    token: {
        address: TOKEN_CONTRACT,
        symbol: 'WETH',
        name: 'Wrapped Ether',
        decimals: 18,
        network: 'ethereum',
        coinGeckoId: 'weth',
    },
    outputToken: {
        address: RECEIPT_TOKEN_CONTRACT,
        symbol: 'trWETH',
        name: 'Trezor Wrapped Ether',
        decimals: 18,
        network: 'ethereum',
        coinGeckoId: 'weth',
    },
    rewardRate: {
        total: 0.05,
        rateType: 'APY',
        components: [],
    },
    status: {
        enter: true,
        exit: true,
    },
    ...overrides,
});

export const mockResolvedYieldFlowData = (
    overrides: Partial<FullyResolvedYieldFlowData> = {},
): FullyResolvedYieldFlowData => {
    const account = mockWalletAccount({ symbol: 'eth' });

    const resolved = {
        resolutionStatus: 'resolved' as const,
        account,
        vault: mockYieldVault(),
        token: {
            networkSymbol: account.symbol,
            symbol: 'WETH',
            decimals: 18,
            contractAddress: TOKEN_CONTRACT,
            coingeckoId: 'weth',
            balance: '25',
        },
        receiptToken: {
            networkSymbol: account.symbol,
            symbol: 'trWETH',
            decimals: 18,
            contractAddress: RECEIPT_TOKEN_CONTRACT,
            coingeckoId: 'weth',
        },
        flowKey: 'flow-key',
        apy: 5,
        depositedAmount: '10',
        depositedSharesAmount: '4',
        isWrappedNativeVault: true,
        wrappedNativeSymbol: 'ETH',
        bonusRewardTokenSymbol: null,
        providerName: 'Morpho',
        tokenSymbol: toTokenSymbol('WETH'),
        vaultName: 'WETH Vault',
        vaultTokenName: 'Trezor Wrapped Ether',
        vaultTokenSymbol: 'trWETH',
        ...overrides,
    };

    // Derive the nested flow data from the merged values so an overridden account/vault/token
    // is never paired with the default one.
    return {
        ...resolved,
        flowData: overrides.flowData ?? {
            account: resolved.account,
            vault: resolved.vault,
            token: resolved.token,
            receiptToken: resolved.receiptToken,
        },
    };
};
