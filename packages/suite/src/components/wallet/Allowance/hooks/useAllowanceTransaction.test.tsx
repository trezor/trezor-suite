import { type ReactNode } from 'react';

import { combineReducers } from '@reduxjs/toolkit';

import { QueryClient, QueryClientProvider } from '@suite-common/react-query';
import {
    act,
    createTestCompositionRoot,
    renderHookWithStoreProvider,
    waitFor,
} from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type PrecomposedLevels,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { buildApprovalTransactionData, isAllowanceUnlimited } from '@suite-common/wallet-utils';
import { type TokenInfo } from '@trezor/blockchain-link-types';
import { mock } from '@trezor/dependency-injection';

import {
    type UseAllowanceTransactionParams,
    useAllowanceTransaction,
} from './useAllowanceTransaction';

const TOKEN_CONTRACT = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const SPENDER = '0x1111111254EEB25477B68fb85Ed929f73A960582';
const TXID = '0xapprovaltxid';

const TOKEN: TokenInfo = {
    standard: 'ERC20',
    contract: TOKEN_CONTRACT,
    symbol: 'usdc',
    name: 'USD Coin',
    decimals: 6,
    balance: '100',
};

const ACCOUNT = mockWalletAccount({
    symbol: asNetworkSymbol('eth'),
    availableBalance: '1000000000000000000',
    tokens: [TOKEN],
});

const COMPOSED_TRANSACTION: PrecomposedTransactionFinal = {
    type: 'final',
    totalSpent: '0',
    fee: '60000',
    feePerByte: '1',
    feeLimit: '60000',
    estimatedFeeLimit: '60000',
    token: TOKEN,
    bytes: 0,
    inputs: [],
    outputsPermutation: [0],
    outputs: [{ address: TOKEN_CONTRACT, amount: '0', script_type: 'PAYTOADDRESS' }],
};

const COMPOSED_LEVELS: PrecomposedLevels = { normal: COMPOSED_TRANSACTION };

type SignAndPushResult = { payload: { txid: string } };

const mockComposeAllowanceTransaction = mock(
    (_params: unknown) => () =>
        Promise.resolve({
            type: 'allowance/compose/fulfilled',
            payload: COMPOSED_LEVELS,
            meta: { requestId: 'compose', requestStatus: 'fulfilled' },
        }),
);
const mockSignAndPush = mock((_params: unknown) => () => ({
    unwrap: (): Promise<SignAndPushResult> => Promise.resolve({ payload: { txid: TXID } }),
}));

jest.mock('@suite-common/wallet-core', () => {
    const actual = jest.requireActual('@suite-common/wallet-core');

    return {
        ...actual,
        composeAllowanceTransactionThunk: (params: unknown) =>
            mockComposeAllowanceTransaction(params),
    };
});

jest.mock('src/actions/wallet/send/sendFormThunks', () => ({
    signAndPushSendFormTransactionThunk: (params: unknown) => mockSignAndPush(params),
}));

type State = { wallet: { fees: Record<string, never> } };

const WALLET_STATE: State['wallet'] = { fees: {} };

const QueryClientWrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);

type Callbacks = Required<
    Pick<
        UseAllowanceTransactionParams,
        'onSelectLimitType' | 'onConfirm' | 'onSendStart' | 'onSent' | 'onSendFailed' | 'onCancel'
    >
>;

const renderAllowanceTransaction = (params: Partial<UseAllowanceTransactionParams> = {}) => {
    const { services } = createTestCompositionRoot<void, State>({
        reducer: combineReducers({ wallet: () => WALLET_STATE }),
    });
    const callbacks = {
        onSelectLimitType: mock<Callbacks['onSelectLimitType']>(),
        onConfirm: mock<Callbacks['onConfirm']>(),
        onSendStart: mock<Callbacks['onSendStart']>(),
        onSent: mock<Callbacks['onSent']>(),
        onSendFailed: mock<Callbacks['onSendFailed']>(),
        onCancel: mock<Callbacks['onCancel']>(),
    };

    const utils = renderHookWithStoreProvider(
        () =>
            useAllowanceTransaction({
                type: 'approve',
                amount: '1.5',
                account: ACCOUNT,
                tokenContractAddress: TOKEN_CONTRACT,
                spender: SPENDER,
                ...callbacks,
                ...params,
            }),
        { services, wrapper: QueryClientWrapper },
    );

    return { ...utils, callbacks };
};

const waitForComposed = async (result: { current: { canSubmit: boolean } }) => {
    await waitFor(() => expect(result.current.canSubmit).toBe(true));
};

describe('useAllowanceTransaction', () => {
    beforeEach(() => {
        mockComposeAllowanceTransaction.mockClear();
        mockSignAndPush.mockClear();
    });

    it('composes an approval of exactly the requested amount by default', async () => {
        const { result } = renderAllowanceTransaction();

        expect(result.current.limitType).toBe('minimal');
        expect(result.current.allowanceAmount).toBe('1500000');

        await waitForComposed(result);

        expect(mockComposeAllowanceTransaction).toHaveBeenCalledWith(
            expect.objectContaining({
                account: ACCOUNT,
                contract: TOKEN_CONTRACT,
                data: buildApprovalTransactionData({ amount: '1500000', spender: SPENDER }),
                selectedFee: 'normal',
                customFee: undefined,
            }),
        );
        expect(result.current.composedTransaction).toEqual(COMPOSED_LEVELS.normal);
        expect(result.current.isSending).toBe(false);
    });

    it('recomposes with an unlimited allowance when that limit is chosen', async () => {
        const { result, callbacks } = renderAllowanceTransaction();
        await waitForComposed(result);

        act(() => {
            result.current.selectLimitType('unlimited');
        });

        expect(callbacks.onSelectLimitType).toHaveBeenCalledWith('unlimited');
        expect(result.current.limitType).toBe('unlimited');
        expect(
            isAllowanceUnlimited({
                amount: result.current.allowanceAmount,
                decimals: TOKEN.decimals,
                isSubunit: true,
            }),
        ).toBe(true);

        await waitFor(() =>
            expect(mockComposeAllowanceTransaction).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    data: buildApprovalTransactionData({
                        amount: result.current.allowanceAmount,
                        spender: SPENDER,
                    }),
                }),
            ),
        );
    });

    it('composes a zero allowance for a revoke', async () => {
        const { result } = renderAllowanceTransaction({ type: 'revoke' });

        expect(result.current.allowanceAmount).toBe('0');

        await waitForComposed(result);

        expect(mockComposeAllowanceTransaction).toHaveBeenCalledWith(
            expect.objectContaining({
                data: buildApprovalTransactionData({ amount: '0', spender: SPENDER }),
            }),
        );
    });

    it('signs and broadcasts the composed transaction and reports its id', async () => {
        let finishSending: (value: SignAndPushResult) => void = () => {};
        mockSignAndPush.mockImplementationOnce(() => () => ({
            unwrap: () =>
                new Promise<SignAndPushResult>(resolve => {
                    finishSending = resolve;
                }),
        }));
        const { result, callbacks } = renderAllowanceTransaction();
        await waitForComposed(result);

        let sending: Promise<void> | undefined;
        act(() => {
            sending = result.current.confirmAndSend();
        });

        expect(callbacks.onConfirm).toHaveBeenCalledWith('minimal');
        expect(callbacks.onSendStart).toHaveBeenCalledTimes(1);
        await waitFor(() => expect(result.current.isSending).toBe(true));
        expect(mockSignAndPush).toHaveBeenCalledWith(
            expect.objectContaining({
                selectedAccount: ACCOUNT,
                precomposedTransaction: COMPOSED_LEVELS.normal,
            }),
        );

        await act(async () => {
            finishSending({ payload: { txid: TXID } });
            await sending;
        });

        expect(callbacks.onSent).toHaveBeenCalledWith(TXID);
        expect(callbacks.onSendFailed).not.toHaveBeenCalled();
        expect(result.current.isSending).toBe(false);
    });

    it('reports a failed signing so the caller can offer another attempt', async () => {
        mockSignAndPush.mockImplementationOnce(() => () => ({
            unwrap: () => Promise.reject(new Error('Action cancelled by user')),
        }));
        const { result, callbacks } = renderAllowanceTransaction();
        await waitForComposed(result);

        await act(async () => {
            await result.current.confirmAndSend();
        });

        expect(callbacks.onSendStart).toHaveBeenCalledTimes(1);
        expect(callbacks.onSendFailed).toHaveBeenCalledTimes(1);
        expect(callbacks.onSent).not.toHaveBeenCalled();
        expect(result.current.isSending).toBe(false);
    });

    it('does not sign before the transaction is composed', async () => {
        const { result, callbacks } = renderAllowanceTransaction();

        await act(async () => {
            await result.current.confirmAndSend();
        });

        expect(callbacks.onConfirm).not.toHaveBeenCalled();
        expect(mockSignAndPush).not.toHaveBeenCalled();
    });

    it('does not approve a token the account does not hold', async () => {
        const { result, callbacks } = renderAllowanceTransaction({
            account: { ...ACCOUNT, tokens: [] },
        });

        await waitFor(() => expect(result.current.composedTransaction).toBeDefined());

        expect(result.current.canSubmit).toBe(false);

        await act(async () => {
            await result.current.confirmAndSend();
        });

        expect(callbacks.onConfirm).not.toHaveBeenCalled();
        expect(mockSignAndPush).not.toHaveBeenCalled();
    });

    it('forwards the approval toast opt-out to the send thunk', async () => {
        const { result } = renderAllowanceTransaction({ shouldShowApprovalToast: false });
        await waitForComposed(result);

        await act(async () => {
            await result.current.confirmAndSend();
        });

        expect(mockSignAndPush).toHaveBeenCalledWith(
            expect.objectContaining({ shouldShowApprovalToast: false }),
        );
    });

    it('hands a cancel over to the caller', () => {
        const { result, callbacks } = renderAllowanceTransaction();

        act(() => {
            result.current.handleCancel();
        });

        expect(callbacks.onCancel).toHaveBeenCalledTimes(1);
    });
});
