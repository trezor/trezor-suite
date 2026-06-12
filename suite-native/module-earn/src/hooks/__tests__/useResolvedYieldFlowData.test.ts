import { type YieldDto } from '@suite-common/earn-stablecoin-api';
import { type Account, type AccountKey } from '@suite-common/wallet-types';
import { type TokenInfo } from '@trezor/connect';

import { resolveYieldFlowData } from '../useResolvedYieldFlowData';

const accountKey = 'eth-account-key' as AccountKey;
const underlyingTokenAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const receiptTokenAddress = '0xde6c23e561f3e55846207ec45a91b777e0f7c889';
const yieldId = 'ethereum-usdc-steakusdc';

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
        description: '',
        underMaintenance: false,
        deprecated: false,
        logoURI: '',
        documentation: '',
        supportedStandards: [],
        supportsCampaigns: false,
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
    inputTokens: [],
    rewardRate: {
        total: 0.05,
        rateType: 'APY',
        components: [],
    },
    status: {
        enter: true,
        exit: true,
    },
} satisfies Omit<YieldDto, 'tokens' | 'mechanics'> as unknown as YieldDto;

const resolve = ({
    tokenContract,
    routeYieldId,
}: {
    tokenContract: string;
    routeYieldId?: string;
}) =>
    resolveYieldFlowData({
        account,
        tokenContract,
        yieldId: routeYieldId,
        yieldOpportunities: [vault],
    });

describe('resolveYieldFlowData', () => {
    it('resolves deposit flow data from the underlying ERC20 token contract', () => {
        const result = resolve({
            tokenContract: underlyingTokenAddress,
            routeYieldId: yieldId,
        });

        expect(result.resolutionStatus).toBe('resolved');

        if (result.resolutionStatus !== 'resolved') {
            throw new Error('Expected resolved yield flow data.');
        }

        expect(result.token.symbol).toBe('USDC');
        expect(result.token.decimals).toBe(6);
        expect(result.token.contractAddress).toBe(underlyingTokenAddress);
        expect(result.receiptToken.symbol).toBe('trSHUSDCp');
        expect(result.receiptToken.contractAddress).toBe(receiptTokenAddress);
        expect(result.flowData.token.symbol).toBe('USDC');
        expect(result.depositedSharesAmount).toBe('1.5');
    });

    it('keeps receipt token data for the existing output-token overview entry', () => {
        const result = resolve({
            tokenContract: receiptTokenAddress,
        });

        expect(result.resolutionStatus).toBe('resolved');

        if (result.resolutionStatus !== 'resolved') {
            throw new Error('Expected resolved yield flow data.');
        }

        expect(result.token.symbol).toBe('USDC');
        expect(result.token.decimals).toBe(6);
        expect(result.token.balance).toBe('25');
        expect(result.receiptToken.symbol).toBe('trSHUSDCp');
        expect(result.depositedSharesAmount).toBe('1.5');
        expect(result.flowKey).toContain(receiptTokenAddress);
    });
});
