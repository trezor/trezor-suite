import { useForm } from 'react-hook-form';
import { IntlProvider } from 'react-intl';

import { act } from '@testing-library/react';

import { configureMockStore, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { asNetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { type ComposeActionContext, type StakeFormState } from '@suite-common/wallet-types';
import { mockWalletAccount, networkSpecificDefaultCardano } from '@suite-common/wallet-types/mocks';

import { composeTransaction } from 'src/actions/wallet/stakeActions';

import { useStakeCompose } from './useStakeCompose';

jest.mock('src/actions/wallet/stakeActions', () => ({
    composeTransaction: jest.fn(),
}));

const composeTransactionMock = composeTransaction as jest.Mock;

const composeActionContext = (): ComposeActionContext => ({
    account: mockWalletAccount({ symbol: asNetworkSymbol('ada') }, networkSpecificDefaultCardano),
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

const renderStakeCompose = () => {
    const store = configureMockStore({ extra: undefined, preloadedState: {} });

    return renderHookWithStoreProvider(
        () => {
            const methods = useForm<StakeFormState>();

            return useStakeCompose({ ...methods, state: composeActionContext() });
        },
        {
            store,
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
});
