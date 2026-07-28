import { type FormState } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { FeeSelectorRow } from './FeeSelectorRow';
import { BTC_ACCOUNT_KEY, getWalletState } from '../../__fixtures__/walletState';

const noopThunk = jest.fn();

describe('FeeSelectorRow', () => {
    const getPreloadedState = () => ({
        wallet: getWalletState(),
    });

    const renderRow = () =>
        renderWithStoreProvider(
            <FeeSelectorRow
                accountKey={BTC_ACCOUNT_KEY}
                updateThunk={noopThunk}
                selectedFee="normal"
                formDraft={null}
            />,
            { preloadedState: getPreloadedState() },
        );

    it('should render the fee row with its testID for a Bitcoin account', () => {
        const { getByTestId } = renderRow();

        expect(getByTestId('@transactionManagement/fee-selector-row')).toBeOnTheScreen();
    });

    it('should render the crypto fee amount formatter', () => {
        const { getByTestId } = renderRow();

        expect(getByTestId('@transactionManagement/fee-crypto-amount')).toBeOnTheScreen();
    });

    it('should render nothing when the account is not in the store', () => {
        const missingAccountKey = mockAccountKey({ symbol: 'btc', descriptor: 'unknownAccount' });

        const { toJSON } = renderWithStoreProvider(
            <FeeSelectorRow
                accountKey={missingAccountKey}
                updateThunk={noopThunk}
                selectedFee="normal"
                formDraft={null}
            />,
            { preloadedState: getPreloadedState() },
        );

        expect(toJSON()).toBeNull();
    });

    it('should render an alert when fees are unavailable and a form draft is set', () => {
        const baseWalletState = getWalletState();
        const preloadedState = {
            wallet: {
                ...baseWalletState,
                send: {
                    ...baseWalletState.send,
                    feeLevels: {
                        ...baseWalletState.send.feeLevels,
                        normal: {
                            type: 'error' as const,
                            error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE' as const,
                        },
                    },
                },
            },
        };

        const { queryByTestId, getByText } = renderWithStoreProvider(
            <FeeSelectorRow
                accountKey={BTC_ACCOUNT_KEY}
                updateThunk={noopThunk}
                selectedFee="normal"
                formDraft={{} as FormState}
            />,
            { preloadedState },
        );

        expect(queryByTestId('@transactionManagement/fee-selector-row')).toBeNull();
        expect(getByText(/Insufficient .* to cover the transaction fee/i)).toBeOnTheScreen();
    });
});
