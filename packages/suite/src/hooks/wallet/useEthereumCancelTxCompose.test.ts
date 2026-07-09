import { useMutation } from '@tanstack/react-query';

import {
    type Account,
    type WalletAccountTransactionWithRequiredRbfParams,
} from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { useDispatch, useSelector } from 'src/hooks/suite';

import { useEthereumCancelTxCompose } from '../useEthereumCancelTxCompose';

// The hook uses only useEffect (plus the mocked suite/react-query hooks), so mocking useEffect to
// run synchronously lets us call it directly and assert its logic without a renderer.
jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useEffect: (effect: () => void) => effect(),
}));

jest.mock('src/hooks/suite', () => ({
    __esModule: true,
    useDispatch: jest.fn(),
    useSelector: jest.fn(),
}));

jest.mock('@tanstack/react-query', () => ({
    __esModule: true,
    useMutation: jest.fn(),
}));

const mockUseDispatch = useDispatch as unknown as jest.Mock;
const mockUseSelector = useSelector as unknown as jest.Mock;
const mockUseMutation = useMutation as unknown as jest.Mock;
const mutate = jest.fn();

const ethAccount = mockWalletAccount({ symbol: 'eth' }) as Account;
const btcAccount = mockWalletAccount({ symbol: 'btc' }) as Account;
const ethTx = {
    rbfParams: { type: 'ethereum' },
} as unknown as WalletAccountTransactionWithRequiredRbfParams;
const bitcoinTx = {
    rbfParams: { type: 'bitcoin' },
} as unknown as WalletAccountTransactionWithRequiredRbfParams;

const feeInfoStub = { levels: [] };

const setMutationResult = (overrides: Record<string, unknown>) =>
    mockUseMutation.mockReturnValue({
        mutate,
        data: undefined,
        error: null,
        isPending: false,
        ...overrides,
    });

describe('useEthereumCancelTxCompose', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseDispatch.mockReturnValue(jest.fn());
        mockUseSelector.mockReturnValue(feeInfoStub);
        setMutationResult({});
    });

    describe('automatic composition', () => {
        it('composes for an ethereum account with fee info and ethereum rbf params', () => {
            useEthereumCancelTxCompose({ account: ethAccount, tx: ethTx });

            expect(mutate).toHaveBeenCalledTimes(1);
        });

        it('does not compose for a non-ethereum account', () => {
            useEthereumCancelTxCompose({ account: btcAccount, tx: ethTx });

            expect(mutate).not.toHaveBeenCalled();
        });

        it('does not compose while fee info is unavailable', () => {
            mockUseSelector.mockReturnValue(undefined);

            useEthereumCancelTxCompose({ account: ethAccount, tx: ethTx });

            expect(mutate).not.toHaveBeenCalled();
        });

        it('does not compose when the tx has no ethereum rbf params', () => {
            useEthereumCancelTxCompose({ account: ethAccount, tx: bitcoinTx });

            expect(mutate).not.toHaveBeenCalled();
        });
    });

    describe('error normalization', () => {
        it('is null when the mutation has not errored', () => {
            setMutationResult({ error: null });

            expect(useEthereumCancelTxCompose({ account: ethAccount, tx: ethTx }).error).toBeNull();
        });

        it('surfaces a plain Error message', () => {
            setMutationResult({ error: new Error('boom') });

            expect(useEthereumCancelTxCompose({ account: ethAccount, tx: ethTx }).error).toBe(
                'boom',
            );
        });

        it('surfaces a ComposeFeeLevelsError message', () => {
            setMutationResult({ error: { error: 'fee-levels-compose-failed', message: 'no fee' } });

            expect(useEthereumCancelTxCompose({ account: ethAccount, tx: ethTx }).error).toBe(
                'no fee',
            );
        });

        it('falls back to the error code when a ComposeFeeLevelsError has no message', () => {
            setMutationResult({ error: { error: 'fee-levels-compose-failed' } });

            expect(useEthereumCancelTxCompose({ account: ethAccount, tx: ethTx }).error).toBe(
                'fee-levels-compose-failed',
            );
        });

        it('returns "Unknown error" for an unrecognized error shape', () => {
            setMutationResult({ error: { somethingElse: true } });

            expect(useEthereumCancelTxCompose({ account: ethAccount, tx: ethTx }).error).toBe(
                'Unknown error',
            );
        });
    });

    it('exposes the composed tx and form state from the mutation data', () => {
        const data = {
            composedCancelTx: { type: 'final' },
            cancelFormState: { outputs: [] },
        };
        setMutationResult({ data });

        const result = useEthereumCancelTxCompose({ account: ethAccount, tx: ethTx });

        expect(result.composedCancelTx).toBe(data.composedCancelTx);
        expect(result.cancelFormState).toBe(data.cancelFormState);
        expect(result.isComposing).toBe(false);
    });
});
