import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import { type Account, type AccountKey } from '@suite-common/wallet-types';
import { type TokenInfo } from '@trezor/connect';

import { getResolvedYieldFlowData } from './getResolvedYieldFlowData';

const accountKey = 'eth-account-key' as AccountKey;
const underlyingTokenAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const receiptTokenAddress = '0xde6c23e561f3e55846207ec45a91b777e0f7c889';
const yieldId = 'ethereum-usdc-steakusdc';

// Blockbook returns EVM token contracts checksummed rather than lowercased. The exact
// checksum does not matter here, only that the casing differs from the normalized form.
const toBackendContractCasing = (address: string) => `0x${address.slice(2).toUpperCase()}`;

const account = {
    key: accountKey,
    symbol: 'eth',
    tokens: [
        {
            contract: underlyingTokenAddress,
            symbol: 'USDC',
            decimals: 6,
            balance: '25',
        },
        {
            contract: receiptTokenAddress,
            symbol: 'trSHUSDCp',
            decimals: 18,
            balance: '1.5',
        },
    ] satisfies Omit<TokenInfo, 'standard'>[],
} as unknown as Account;

const vault = {
    id: yieldId,
    network: 'ethereum',
    chainId: 1,
    providerId: 'morpho',
    metadata: {
        name: 'Steakhouse USDC Prime',
        underMaintenance: false,
        deprecated: false,
    },
    token: {
        address: underlyingTokenAddress,
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        network: 'ethereum',
        coinGeckoId: 'usd-coin',
    },
    outputToken: {
        address: receiptTokenAddress,
        symbol: 'trSHUSDCp',
        name: 'Trezor Steakhouse USDC Prime',
        decimals: 18,
        network: 'ethereum',
        coinGeckoId: 'usd-coin',
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
} satisfies YieldDtoV2 as unknown as YieldDtoV2;

describe('getResolvedYieldFlowData', () => {
    it('resolves the account token entries for the vault input and receipt tokens', () => {
        const result = getResolvedYieldFlowData({ account, vault });

        expect(result.resolutionStatus).toBe('resolved');

        if (result.resolutionStatus !== 'resolved') {
            throw new Error('Expected resolved yield flow data.');
        }

        expect(result.token.symbol).toBe('USDC');
        expect(result.token.decimals).toBe(6);
        expect(result.token.contractAddress).toBe(underlyingTokenAddress);
        expect(result.token.balance).toBe('25');
        expect(result.receiptToken.symbol).toBe('trSHUSDCp');
        expect(result.receiptToken.contractAddress).toBe(receiptTokenAddress);
        expect(result.vaultName).toBe('Steakhouse USDC Prime');
        expect(result.vaultTokenName).toBe('Trezor Steakhouse USDC Prime');
        expect(result.vaultTokenSymbol).toBe('trSHUSDCp');
        expect(result.providerName).toBe('Morpho');
        expect(result.flowData.token.symbol).toBe('USDC');
        expect(result.depositedSharesAmount).toBe('1.5');
    });

    it('keys the flow on the vault input token by default', () => {
        const result = getResolvedYieldFlowData({ account, vault });

        expect(result.flowKey).toBe(`${accountKey}:${yieldId}:${underlyingTokenAddress}`);
    });

    it('keys the flow on the contract it was addressed by', () => {
        const result = getResolvedYieldFlowData({
            account,
            vault,
            tokenContract: receiptTokenAddress,
        });

        expect(result.flowKey).toBe(`${accountKey}:${yieldId}:${receiptTokenAddress}`);
        // Being addressed by the receipt token must not change what the tokens themselves are.
        expect(result.token?.symbol).toBe('USDC');
        expect(result.token?.balance).toBe('25');
        expect(result.receiptToken?.symbol).toBe('trSHUSDCp');
    });

    it('matches account tokens by contract address regardless of letter case', () => {
        const result = getResolvedYieldFlowData({
            account,
            vault,
            tokenContract: receiptTokenAddress.toUpperCase(),
        });

        expect(result.flowKey).toBe(`${accountKey}:${yieldId}:${receiptTokenAddress}`);
        expect(result.depositedSharesAmount).toBe('1.5');
    });

    it('normalizes the contract casing the backend returns for held tokens', () => {
        const checksummedAccount = {
            ...account,
            tokens: account.tokens?.map(accountToken => ({
                ...accountToken,
                contract: toBackendContractCasing(accountToken.contract),
            })),
        } as unknown as Account;

        const result = getResolvedYieldFlowData({ account: checksummedAccount, vault });

        // The tokens must still be matched and their balances kept ...
        expect(result.token?.balance).toBe('25');
        expect(result.depositedSharesAmount).toBe('1.5');
        // ... while the exposed contracts stay normalized, so that the derived asset logo URLs
        // and fiat rate tickers keep resolving.
        expect(result.token?.contractAddress).toBe(underlyingTokenAddress);
        expect(result.receiptToken?.contractAddress).toBe(receiptTokenAddress);
        expect(result.flowKey).toBe(`${accountKey}:${yieldId}:${underlyingTokenAddress}`);
    });

    it('falls back to the vault token data when the account does not hold the token', () => {
        const emptyAccount = { ...account, tokens: [] } as unknown as Account;

        const result = getResolvedYieldFlowData({ account: emptyAccount, vault });

        expect(result.token?.symbol).toBe('USDC');
        expect(result.token?.decimals).toBe(6);
        expect(result.token?.balance).toBe('0');
        expect(result.depositedSharesAmount).toBe('0');
        expect(result.depositedAmount).toBe('0');
    });

    it('reports a missing account', () => {
        const result = getResolvedYieldFlowData({ account: null, vault });

        expect(result.resolutionStatus).toBe('missing-account');
        expect(result.flowKey).toBeNull();
        expect(result.vault).toBeNull();
    });

    it('reports a missing vault', () => {
        const result = getResolvedYieldFlowData({ account, vault: null });

        expect(result.resolutionStatus).toBe('missing-vault');
        expect(result.account).toBe(account);
        expect(result.flowKey).toBeNull();
    });

    it('treats a vault without a receipt token address as no vault', () => {
        const vaultWithoutOutputToken = {
            ...vault,
            outputToken: { ...vault.outputToken, address: undefined },
        } as unknown as YieldDtoV2;

        const result = getResolvedYieldFlowData({ account, vault: vaultWithoutOutputToken });

        expect(result.resolutionStatus).toBe('missing-vault');
    });

    it('reports an unknown network but keeps the vault display data', () => {
        const vaultOnUnknownNetwork = {
            ...vault,
            network: 'not-a-real-network',
        } as unknown as YieldDtoV2;

        const result = getResolvedYieldFlowData({ account, vault: vaultOnUnknownNetwork });

        expect(result.resolutionStatus).toBe('missing-network');
        expect(result.vaultName).toBe('Steakhouse USDC Prime');
        expect(result.apy).not.toBeNull();
        expect(result.flowData).toBeNull();
        expect(result.flowKey).toBeNull();
    });
});
