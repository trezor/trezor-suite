import { useQuery } from '@suite-common/react-query';
import { createTestCompositionRoot, renderHookWithStoreProvider } from '@suite-common/test-utils';
import {
    type Account,
    type FeeInfo,
    type WalletAccountTransactionWithRequiredRbfParams,
} from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { asNetworkSymbol } from '@trezor/network-module';

import { useEthereumCancelTxCompose } from './useEthereumCancelTxCompose';

jest.mock('@suite-common/react-query', () => ({
    __esModule: true,
    ...jest.requireActual('@suite-common/react-query'),
    useQuery: jest.fn(),
}));

const mockUseQuery = useQuery as unknown as jest.Mock;

const ethAccount = mockWalletAccount({ symbol: asNetworkSymbol('eth') }) as Account;
const btcAccount = mockWalletAccount({ symbol: asNetworkSymbol('btc') }) as Account;
const ethTx = {
    rbfParams: { type: 'ethereum' },
} as unknown as WalletAccountTransactionWithRequiredRbfParams;
const bitcoinTx = {
    rbfParams: { type: 'bitcoin' },
} as unknown as WalletAccountTransactionWithRequiredRbfParams;

const feeInfoStub: FeeInfo = {
    blockHeight: 0,
    blockTime: 12,
    minFee: 1,
    maxFee: 1000,
    minPriorityFee: 1,
    levels: [],
};

const setQueryResult = (overrides: Record<string, unknown>) =>
    mockUseQuery.mockReturnValue({
        data: undefined,
        error: null,
        isLoading: false,
        ...overrides,
    });

const lastQueryOptions = () => mockUseQuery.mock.calls.at(-1)?.[0];

// isRejected/isFulfilled require both meta.requestId and meta.requestStatus.
const mockDispatchResult = (requestStatus: 'fulfilled' | 'rejected', payload?: unknown) =>
    jest.fn().mockResolvedValue({
        meta: { requestId: 'mock-request-id', requestStatus },
        payload,
    });

const renderUseEthereumCancelTxCompose = ({
    account = ethAccount,
    tx = ethTx,
    feeInfo = feeInfoStub,
    dispatch = jest.fn(),
}: {
    account?: Account;
    tx?: WalletAccountTransactionWithRequiredRbfParams;
    feeInfo?: FeeInfo | null;
    dispatch?: jest.Mock;
} = {}) => {
    const root = createTestCompositionRoot({
        extra: { services: {} },
        preloadedState: {
            wallet: {
                fees: feeInfo ? { eth: { status: 'loaded' as const, data: feeInfo } } : {},
            },
        },
    });
    root.store.dispatch = dispatch;

    return renderHookWithStoreProvider(() => useEthereumCancelTxCompose({ account, tx }), { root });
};

describe('useEthereumCancelTxCompose', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        setQueryResult({});
    });

    describe('composition gating', () => {
        it('is enabled for an ethereum account with fee info and ethereum rbf params', () => {
            renderUseEthereumCancelTxCompose();

            expect(lastQueryOptions().enabled).toBe(true);
        });

        it('is disabled for a non-ethereum account', () => {
            renderUseEthereumCancelTxCompose({ account: btcAccount });

            expect(lastQueryOptions().enabled).toBe(false);
        });

        it('is disabled while fee info is unavailable', () => {
            renderUseEthereumCancelTxCompose({ feeInfo: null });

            expect(lastQueryOptions().enabled).toBe(false);
        });

        it('is disabled when the tx has no ethereum rbf params', () => {
            renderUseEthereumCancelTxCompose({ tx: bitcoinTx });

            expect(lastQueryOptions().enabled).toBe(false);
        });
    });

    describe('composing via the thunk', () => {
        it('returns the thunk payload when composition succeeds', async () => {
            const payload = { composedCancelTx: {}, cancelFormState: {} };
            const dispatch = mockDispatchResult('fulfilled', payload);

            renderUseEthereumCancelTxCompose({ dispatch });

            await expect(lastQueryOptions().queryFn()).resolves.toBe(payload);
        });

        it('throws the reject payload message when composition fails', async () => {
            const dispatch = mockDispatchResult('rejected', {
                error: 'fee-levels-compose-failed',
                message: 'no fee',
            });

            renderUseEthereumCancelTxCompose({ dispatch });

            await expect(lastQueryOptions().queryFn()).rejects.toThrow('no fee');
        });

        it('falls back to the error code when the reject payload has no message', async () => {
            const dispatch = mockDispatchResult('rejected', {
                error: 'fee-levels-compose-failed',
            });

            renderUseEthereumCancelTxCompose({ dispatch });

            await expect(lastQueryOptions().queryFn()).rejects.toThrow('fee-levels-compose-failed');
        });

        it('falls back to "Unknown error" when there is no reject payload at all', async () => {
            const dispatch = mockDispatchResult('rejected');

            renderUseEthereumCancelTxCompose({ dispatch });

            await expect(lastQueryOptions().queryFn()).rejects.toThrow('Unknown error');
        });
    });

    describe('error normalization', () => {
        it('is null when the query has not errored', () => {
            setQueryResult({ error: null });

            expect(renderUseEthereumCancelTxCompose().result.current.error).toBeNull();
        });

        it('surfaces the error message', () => {
            setQueryResult({ error: new Error('boom') });

            expect(renderUseEthereumCancelTxCompose().result.current.error).toBe('boom');
        });
    });

    it('exposes the composed tx and form state from the query data', () => {
        const data = {
            composedCancelTx: { type: 'final' },
            cancelFormState: { outputs: [] },
        };
        setQueryResult({ data, isLoading: true });

        const { result } = renderUseEthereumCancelTxCompose();

        expect(result.current.composedCancelTx).toBe(data.composedCancelTx);
        expect(result.current.cancelFormState).toBe(data.cancelFormState);
        expect(result.current.isComposing).toBe(true);
    });
});
