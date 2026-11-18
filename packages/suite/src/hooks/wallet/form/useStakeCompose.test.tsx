import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { IntlProvider } from 'react-intl';

import { act } from '@testing-library/react';

import { createTestCompositionRoot, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { asNetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { type ComposeActionContext, type StakeFormState } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { composeTransaction } from '#src/actions/wallet/stakeActions';

import { useStakeCompose } from './useStakeCompose';
import { type MockSuiteState } from '../../../../mocks/mockInitialAppState';

jest.mock('#src/actions/wallet/stakeActions', () => ({
    composeTransaction: jest.fn(),
}));

const composeTransactionMock = composeTransaction as jest.Mock;

const composeActionContext = (): ComposeActionContext => ({
    account: mockWalletAccount({ symbol: asNetworkSymbol('ada') }),
    network: getNetwork(asNetworkSymbol('ada')),
    feeInfo: {
        blockHeight: 0,
        blockTime: 20,
        minFee: 44,
        maxFee: 44,
        minPriorityFee: 0,
        levels: [],
    },
});

const renderStakeCompose = (setErrorSpy?: jest.Mock) => {
    const { services } = createTestCompositionRoot<void, MockSuiteState>({ preloadedState: {} });

    return renderHookWithStoreProvider(
        () => {
            const methods = useForm<StakeFormState>();
            const setError: typeof methods.setError = useCallback(
                (...args) => {
                    setErrorSpy?.(...args);
                    methods.setError(...args);
                },
                [methods],
            );

            return useStakeCompose({ ...methods, setError, state: composeActionContext() });
        },
        {
            services,
            wrapper: ({ children }) => <IntlProvider locale="en">{children}</IntlProvider>,
        },
    );
};

describe('useStakeCompose', () => {
    beforeEach(() => {
        composeTransactionMock.mockReset();
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('settles a rejected compose instead of letting it escape as an unhandled rejection', async () => {
        const utxoAddress = 'addr1q9utxo';
        composeTransactionMock.mockReturnValue(() =>
            Promise.reject(
                new Error(`Invalid parameter "account.utxo" (= [{"address":"${utxoAddress}"}])`),
            ),
        );

        const { result } = renderStakeCompose();

        await act(async () => {
            await expect(result.current.composeRequest()).resolves.toBeUndefined();
        });

        expect(composeTransactionMock).toHaveBeenCalled();
        expect(result.current.isLoading).toBe(false);
        expect(result.current.composedLevels).toBeUndefined();
    });

    it('does not log the rejection message, which may embed the composed account payload', async () => {
        const utxoAddress = 'addr1q9utxo';
        composeTransactionMock.mockReturnValue(() =>
            Promise.reject(
                new Error(`Invalid parameter "account.utxo" (= [{"address":"${utxoAddress}"}])`),
            ),
        );

        const { result } = renderStakeCompose();

        await act(async () => {
            await result.current.composeRequest();
        });

        expect(JSON.stringify(jest.mocked(console.warn).mock.calls)).not.toContain(utxoAddress);
    });

    it('sets a composed error level on the form once', async () => {
        composeTransactionMock.mockReturnValue(() =>
            Promise.resolve({
                normal: {
                    type: 'error',
                    error: 'AMOUNT_IS_NOT_ENOUGH',
                    errorMessage: { id: 'AMOUNT_IS_NOT_ENOUGH' },
                },
            }),
        );
        const setErrorSpy = jest.fn();

        const { result } = renderStakeCompose(setErrorSpy);

        await act(async () => {
            await result.current.composeRequest();
        });

        expect(setErrorSpy).toHaveBeenCalledTimes(1);
    });
});
