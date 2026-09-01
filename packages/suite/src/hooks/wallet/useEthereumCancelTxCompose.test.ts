import { useQuery } from '@suite-common/react-query';
import { useDispatch } from '@suite-common/redux-utils';
import {
    type Account,
    type WalletAccountTransactionWithRequiredRbfParams,
} from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { useSelector } from 'src/hooks/suite';

import { useEthereumCancelTxCompose } from './useEthereumCancelTxCompose';

jest.mock('@suite-common/redux-utils', () => ({
    __esModule: true,
    ...jest.requireActual('@suite-common/redux-utils'),
    useDispatch: jest.fn(),
}));

jest.mock('src/hooks/suite', () => ({
    __esModule: true,
    useSelector: jest.fn(),
}));

jest.mock('@suite-common/react-query', () => ({
    __esModule: true,
    ...jest.requireActual('@suite-common/react-query'),
    useQuery: jest.fn(),
}));

const mockUseDispatch = useDispatch as unknown as jest.Mock;
const mockUseSelector = useSelector as unknown as jest.Mock;
const mockUseQuery = useQuery as unknown as jest.Mock;

const ethAccount = mockWalletAccount({ symbol: 'eth' }) as Account;
const btcAccount = mockWalletAccount({ symbol: 'btc' }) as Account;
const ethTx = {
    rbfParams: { type: 'ethereum' },
} as unknown as WalletAccountTransactionWithRequiredRbfParams;
const bitcoinTx = {
    rbfParams: { type: 'bitcoin' },
} as unknown as WalletAccountTransactionWithRequiredRbfParams;

const feeInfoStub = { levels: [] };

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
    mockUseDispatch.mockReturnValue(
        jest.fn().mockResolvedValue({
            meta: { requestId: 'mock-request-id', requestStatus },
            payload,
        }),
    );

describe('useEthereumCancelTxCompose', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseDispatch.mockReturnValue(jest.fn());
        mockUseSelector.mockReturnValue(feeInfoStub);
        setQueryResult({});
    });

    describe('composition gating', () => {
        it('is enabled for an ethereum account with fee info and ethereum rbf params', () => {
            useEthereumCancelTxCompose({ account: ethAccount, tx: ethTx });

            expect(lastQueryOptions().enabled).toBe(true);
        });

        it('is disabled for a non-ethereum account', () => {
            useEthereumCancelTxCompose({ account: btcAccount, tx: ethTx });

            expect(lastQueryOptions().enabled).toBe(false);
        });

        it('is disabled while fee info is unavailable', () => {
            mockUseSelector.mockReturnValue(undefined);

            useEthereumCancelTxCompose({ account: ethAccount, tx: ethTx });

            expect(lastQueryOptions().enabled).toBe(false);
        });

        it('is disabled when the tx has no ethereum rbf params', () => {
            useEthereumCancelTxCompose({ account: ethAccount, tx: bitcoinTx });

            expect(lastQueryOptions().enabled).toBe(false);
        });
    });

    describe('composing via the thunk', () => {
        it('returns the thunk payload when composition succeeds', async () => {
            const payload = { composedCancelTx: {}, cancelFormState: {} };
            mockDispatchResult('fulfilled', payload);

            useEthereumCancelTxCompose({ account: ethAccount, tx: ethTx });

            await expect(lastQueryOptions().queryFn()).resolves.toBe(payload);
        });

        it('throws the reject payload message when composition fails', async () => {
            mockDispatchResult('rejected', {
                error: 'fee-levels-compose-failed',
                message: 'no fee',
            });

            useEthereumCancelTxCompose({ account: ethAccount, tx: ethTx });

            await expect(lastQueryOptions().queryFn()).rejects.toThrow('no fee');
        });

        it('falls back to the error code when the reject payload has no message', async () => {
            mockDispatchResult('rejected', { error: 'fee-levels-compose-failed' });

            useEthereumCancelTxCompose({ account: ethAccount, tx: ethTx });

            await expect(lastQueryOptions().queryFn()).rejects.toThrow('fee-levels-compose-failed');
        });

        it('falls back to "Unknown error" when there is no reject payload at all', async () => {
            mockDispatchResult('rejected');

            useEthereumCancelTxCompose({ account: ethAccount, tx: ethTx });

            await expect(lastQueryOptions().queryFn()).rejects.toThrow('Unknown error');
        });
    });

    describe('error normalization', () => {
        it('is null when the query has not errored', () => {
            setQueryResult({ error: null });

            expect(useEthereumCancelTxCompose({ account: ethAccount, tx: ethTx }).error).toBeNull();
        });

        it('surfaces the error message', () => {
            setQueryResult({ error: new Error('boom') });

            expect(useEthereumCancelTxCompose({ account: ethAccount, tx: ethTx }).error).toBe(
                'boom',
            );
        });
    });

    it('exposes the composed tx and form state from the query data', () => {
        const data = {
            composedCancelTx: { type: 'final' },
            cancelFormState: { outputs: [] },
        };
        setQueryResult({ data, isLoading: true });

        const result = useEthereumCancelTxCompose({ account: ethAccount, tx: ethTx });

        expect(result.composedCancelTx).toBe(data.composedCancelTx);
        expect(result.cancelFormState).toBe(data.cancelFormState);
        expect(result.isComposing).toBe(true);
    });
});
