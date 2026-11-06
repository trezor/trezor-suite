import '@suite-common/test-utils/globalOverrides';

import { IntlProvider } from 'react-intl';

import { act } from '@testing-library/react';

import { messages } from '@suite/intl';
import { createTestCompositionRoot, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { stakeActions } from '@suite-common/wallet-core';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { signTransactionThunk } from 'src/actions/wallet/stakeActions';
import { type AppState } from 'src/reducers/store';

import { useWithdrawalForm } from './useWithdrawalForm';
import { mockInitialAppState } from '../../../mocks/mockInitialAppState';

jest.mock('src/actions/wallet/stakeActions', () => ({ signTransactionThunk: jest.fn() }));
jest.mock('src/hooks/wallet/form/useStakeCompose', () => ({
    useStakeCompose: () => ({
        isLoading: false,
        hasComposeError: false,
        composedLevels: { normal: { type: 'final' } },
        composeRequest: jest.fn(),
        onFeeLevelChange: jest.fn(),
    }),
}));
jest.mock('src/hooks/wallet/form/useFees', () => ({
    useFees: () => ({ selectedFee: 'normal', changeFeeLevel: jest.fn() }),
}));

describe('unstake signing failures', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });
    afterEach(() => jest.restoreAllMocks());

    it.each(['ada', 'eth', 'sol'])(
        'shows a safe error and allows another attempt on %s',
        async symbol => {
            const account = mockWalletAccount({ symbol: asNetworkSymbol(symbol) });
            const { services } = createTestCompositionRoot<void, AppState>({
                preloadedState: mockInitialAppState,
            });
            const dispatch = jest.spyOn(services.store, 'dispatch');
            jest.mocked(signTransactionThunk).mockReturnValue(() =>
                Promise.reject(new Error('Sensitive account payload')),
            );
            const { result } = renderHookWithStoreProvider(() => useWithdrawalForm({ account }), {
                services,
                wrapper: ({ children }) => <IntlProvider locale="en">{children}</IntlProvider>,
            });

            await act(async () => {
                await expect(result.current.signTx()).resolves.toBeUndefined();
            });

            expect(dispatch).toHaveBeenCalledWith(stakeActions.requestSignTransaction());
            expect(dispatch).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: notificationsActions.addToast.type,
                    payload: expect.objectContaining({
                        type: 'sign-tx-error',
                        error: messages.TR_STAKING_ERROR_GENERIC.defaultMessage,
                    }),
                }),
            );
            expect(JSON.stringify(jest.mocked(console.warn).mock.calls)).not.toContain('Sensitive');

            jest.mocked(signTransactionThunk).mockReturnValue(() => Promise.resolve(undefined));
            await act(async () => {
                await result.current.signTx();
            });
            expect(signTransactionThunk).toHaveBeenCalledTimes(2);
        },
    );
});
