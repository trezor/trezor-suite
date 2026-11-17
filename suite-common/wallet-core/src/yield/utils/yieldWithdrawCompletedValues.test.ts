import { toTokenAddress } from '@suite-common/tokens';
import { asNetworkSymbol } from '@suite-common/wallet-config';

import { mockYieldVault } from '../../../mocks/mockResolvedYieldFlowData';
import { type YieldFlowDisplayToken } from '../yieldTypes';
import { getYieldWithdrawCompletedValues } from './yieldWithdrawCompletedValues';

type Params = Parameters<typeof getYieldWithdrawCompletedValues>[0];

const ethSymbol = asNetworkSymbol('eth');

const TOKEN_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const RECEIPT_TOKEN_ADDRESS = '0x1111111111111111111111111111111111111111';

const token: YieldFlowDisplayToken = {
    networkSymbol: ethSymbol,
    contractAddress: toTokenAddress(TOKEN_ADDRESS),
};

const receiptToken: YieldFlowDisplayToken = {
    networkSymbol: ethSymbol,
    contractAddress: toTokenAddress(RECEIPT_TOKEN_ADDRESS),
};

const defaultVault = mockYieldVault();

// 1 share (trSHETHp) is worth 1.05 WETH.
const vault: Params['vault'] = {
    token: { ...defaultVault.token, address: TOKEN_ADDRESS, symbol: 'WETH', decimals: 18 },
    outputToken: {
        ...defaultVault.outputToken!,
        address: RECEIPT_TOKEN_ADDRESS,
        symbol: 'trSHETHp',
        decimals: 18,
    },
    state: {
        pricePerShareState: {
            price: '1.05',
            shareToken: { symbol: 'trSHETHp', network: 'ethereum', name: 'trSHETHp', decimals: 18 },
            quoteToken: {
                symbol: 'WETH',
                network: 'ethereum',
                name: 'Wrapped Ether',
                decimals: 18,
            },
        },
    },
};

const base = {
    networkSymbol: ethSymbol,
    token,
    receiptToken,
    vault,
} satisfies Omit<Params, 'flowType' | 'completedAmount' | 'unwrappedAmount'>;

describe('getYieldWithdrawCompletedValues', () => {
    it('redeem without unwrap: sends the trSHETHp shares entered, receives WETH', () => {
        const { input, output } = getYieldWithdrawCompletedValues({
            ...base,
            flowType: 'redeem',
            completedAmount: '2', // shares
            unwrappedAmount: null,
        });

        expect(input).toEqual({ token: receiptToken, amount: '2' });
        expect(output).toEqual({ token, amount: '2.1' }); // 2 shares * 1.05
    });

    it('redeem with unwrap: sends the trSHETHp shares, receives native ETH', () => {
        const { input, output } = getYieldWithdrawCompletedValues({
            ...base,
            flowType: 'redeem',
            completedAmount: '2', // shares
            unwrappedAmount: '2.1', // ETH received after unwrap
        });

        expect(input).toEqual({ token: receiptToken, amount: '2' });
        expect(output).toEqual({ token: { networkSymbol: ethSymbol }, amount: '2.1' });
    });

    it('withdraw (asset unit) without unwrap: derives the trSHETHp shares sent, receives WETH', () => {
        const { input, output } = getYieldWithdrawCompletedValues({
            ...base,
            flowType: 'withdraw',
            completedAmount: '2.1', // WETH
            unwrappedAmount: null,
        });

        // 2.1 WETH / 1.05 = 2 trSHETHp shares burned.
        expect(input).toEqual({ token: receiptToken, amount: '2' });
        expect(output).toEqual({ token, amount: '2.1' });
    });

    it('withdraw (asset unit) with unwrap: derives the trSHETHp shares sent, receives native ETH', () => {
        const { input, output } = getYieldWithdrawCompletedValues({
            ...base,
            flowType: 'withdraw',
            completedAmount: '2.1', // WETH
            unwrappedAmount: '2.1', // ETH received after unwrap
        });

        expect(input).toEqual({ token: receiptToken, amount: '2' });
        expect(output).toEqual({ token: { networkSymbol: ethSymbol }, amount: '2.1' });
    });

    it.each(['redeem', 'withdraw'] as const)(
        '%s without a known price per share: falls back to the completed amount for both legs',
        flowType => {
            const { input, output } = getYieldWithdrawCompletedValues({
                ...base,
                vault: { ...vault, state: undefined },
                flowType,
                completedAmount: '2.1',
                unwrappedAmount: null,
            });

            expect(input).toEqual({ token: receiptToken, amount: '2.1' });
            expect(output).toEqual({ token, amount: '2.1' });
        },
    );
});
