import { act, renderHook } from '@testing-library/react';

import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import {
    type ResolvedYieldFlowData,
    type YieldPositionFlowType,
    type YieldSessionState,
    initialStablecoinYieldSessionState,
} from '@suite-common/wallet-core';
import { toTokenSymbol } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { useYieldForm } from './useYieldForm';

const FLOW_KEY = 'yield-flow';
const TOKEN_ADDRESS = '0x0000000000000000000000000000000000000001';
const RECEIPT_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000002';
const ETH_RATE = 2;

const account = mockWalletAccount({
    symbol: 'eth',
    formattedBalance: '0.2',
});
const vault = {
    id: 'ethereum-weth-vault',
    network: 'ethereum',
    chainId: 1,
    providerId: 'morpho',
    metadata: {
        name: 'WETH Vault',
        underMaintenance: false,
        deprecated: false,
    },
    token: {
        address: TOKEN_ADDRESS,
        symbol: 'WETH',
        name: 'Wrapped Ether',
        decimals: 18,
        network: 'ethereum',
        coinGeckoId: 'weth',
    },
    outputToken: {
        address: RECEIPT_TOKEN_ADDRESS,
        symbol: 'mvWETH',
        name: 'Morpho Vault WETH',
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
} satisfies YieldDtoV2 as unknown as YieldDtoV2;
const token = {
    networkSymbol: account.symbol,
    symbol: 'WETH',
    decimals: 18,
    contractAddress: TOKEN_ADDRESS,
    coingeckoId: 'weth',
    balance: '25',
};
const receiptToken = {
    networkSymbol: account.symbol,
    symbol: 'mvWETH',
    decimals: 18,
    contractAddress: RECEIPT_TOKEN_ADDRESS,
    coingeckoId: 'weth',
};
const flowData = {
    resolutionStatus: 'resolved',
    account,
    vault,
    token,
    receiptToken,
    flowData: { account, vault, token, receiptToken },
    flowKey: FLOW_KEY,
    apy: 5,
    depositedAmount: '10',
    depositedSharesAmount: '4',
    isWrappedNativeVault: true,
    wrappedNativeSymbol: 'ETH',
    bonusRewardTokenSymbol: null,
    providerName: 'Morpho',
    tokenSymbol: toTokenSymbol('WETH'),
    vaultName: 'WETH Vault',
    vaultTokenName: 'Morpho Vault WETH',
    vaultTokenSymbol: 'mvWETH',
} satisfies ResolvedYieldFlowData;

const createMockSession = (): YieldSessionState => ({
    ...initialStablecoinYieldSessionState,
    approval: { ...initialStablecoinYieldSessionState.approval },
    action: { ...initialStablecoinYieldSessionState.action },
    result: {
        ...initialStablecoinYieldSessionState.result,
        completedRewards: [...initialStablecoinYieldSessionState.result.completedRewards],
    },
});

let mockSession = createMockSession();

const getMockState = () => ({
    wallet: {
        settings: { localCurrency: 'usd' },
        fiat: {
            current: {
                'eth-usd': { rate: ETH_RATE },
                [`eth-${TOKEN_ADDRESS}-usd`]: { rate: ETH_RATE },
            },
        },
    },
});

// Reads the mutable `mockSession` at render time, so reassign-then-rerender takes effect.
const renderYieldForm = (flowType: YieldPositionFlowType = 'deposit') =>
    renderHook(() =>
        useYieldForm({
            flowType,
            flowData,
            account,
            vault,
            flowKey: FLOW_KEY,
            session: mockSession,
        }),
    );

jest.mock('src/hooks/suite', () => ({
    useSelector: (selector: (state: ReturnType<typeof getMockState>) => unknown) =>
        selector(getMockState()),
}));

jest.mock('@suite-common/dependency-injection', () => ({
    useServices: () => ({ analytics: { report: jest.fn() } }),
}));

jest.mock('@suite/analytics', () => ({ selectDesktopAnalyticsDep: () => ({}) }));

describe('useYieldForm', () => {
    beforeEach(() => {
        mockSession = createMockSession();
    });

    it('derives the step-aware max amount and wrap balance threshold', () => {
        mockSession.step = 'wrap';
        const { result } = renderYieldForm();

        expect(result.current.maxAmount).toBe('0.195');
        expect(result.current.amountIssues).toEqual(['amount-empty']);

        act(() => result.current.setAmountInput('0.2'));

        expect(result.current.amountIssues).toEqual([]);

        act(() => result.current.setAmountInput('0.200000000000000001'));

        expect(result.current.amountIssues).toEqual(['amount-too-high']);
    });

    it.each([
        { flowType: 'deposit', expected: '25' },
        { flowType: 'withdraw', expected: '10' },
        { flowType: 'redeem', expected: '4' },
    ] as const)('derives the $flowType action max amount', ({ flowType, expected }) => {
        mockSession.step = 'action';
        const { result } = renderYieldForm(flowType);

        expect(result.current.maxAmount).toBe(expected);
    });

    it('uses the token balance as the unwrap max amount', () => {
        mockSession.step = 'unwrap';
        const { result } = renderYieldForm('withdraw');

        expect(result.current.maxAmount).toBe('25');
    });

    it('uses the validation error of the active fiat or crypto input', () => {
        mockSession.step = 'wrap';
        const { result } = renderYieldForm();

        act(() => result.current.fiatToggle?.onToggle());
        act(() => result.current.methods.setError('fiatInput', { type: 'decimals' }));

        expect(result.current.amountIssues).toContain('amount-invalid-decimals');

        act(() => result.current.fiatToggle?.onToggle());

        expect(result.current.amountIssues).not.toContain('amount-invalid-decimals');

        act(() => result.current.methods.setError('amountInput', { type: 'decimals' }));

        expect(result.current.amountIssues).toContain('amount-invalid-decimals');
    });

    it('keeps blocking on a stale crypto decimals error after toggling to fiat', () => {
        mockSession.step = 'action';
        const { result } = renderYieldForm();

        act(() => result.current.setAmountInput('1'));
        act(() => result.current.methods.setError('amountInput', { type: 'decimals' }));
        act(() => result.current.fiatToggle?.onToggle());

        expect(result.current.fiatToggle?.currency).toBe('fiat');
        expect(result.current.amountIssues).toContain('amount-invalid-decimals');
    });

    it('fills both amount fields when an approval advances in fiat mode', () => {
        mockSession.step = 'approve';
        const { result, rerender } = renderYieldForm();

        act(() => result.current.fiatToggle?.onToggle());

        mockSession = {
            ...mockSession,
            step: 'action',
            action: { ...mockSession.action, amount: '3' },
        };
        rerender();

        expect(result.current.methods.getValues()).toEqual({
            amountInput: '3',
            fiatInput: '6.00',
        });
    });

    it('restores the pending amount when re-entering a resumable flow', () => {
        mockSession = {
            ...mockSession,
            step: 'action',
            action: {
                ...mockSession.action,
                pendingTransaction: {
                    type: 'deposit',
                    txid: 'pending-txid',
                    amount: '7',
                },
            },
        };

        const { result } = renderYieldForm();

        expect(result.current.methods.getValues('amountInput')).toBe('7');
    });

    it('resets the form when the flow key changes', () => {
        const { result, rerender } = renderHook(
            ({ currentFlowKey }) =>
                useYieldForm({
                    flowType: 'deposit',
                    flowData,
                    account,
                    vault,
                    flowKey: currentFlowKey,
                    session: mockSession,
                }),
            { initialProps: { currentFlowKey: FLOW_KEY } },
        );

        act(() => result.current.setAmountInput('5'));
        rerender({ currentFlowKey: 'other-flow' });

        expect(result.current.methods.getValues()).toEqual({
            amountInput: '',
            fiatInput: '',
        });
    });
});
