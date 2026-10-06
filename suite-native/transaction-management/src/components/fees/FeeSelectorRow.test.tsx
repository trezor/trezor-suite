import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type FormState } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { FeeSelectorRow } from './FeeSelectorRow';
import { BTC_ACCOUNT_KEY, getWalletState } from '../../__fixtures__/walletState';

const noopThunk = jest.fn();
const btcSymbol = asNetworkSymbol('btc');

describe('FeeSelectorRow', () => {
    const getPreloadedState = () => ({
        wallet: getWalletState(),
    });

    const renderRow = async () =>
        await renderWithStoreProvider(
            <FeeSelectorRow
                accountKey={BTC_ACCOUNT_KEY}
                updateThunk={noopThunk}
                selectedFee="normal"
                formDraft={null}
            />,
            { preloadedState: getPreloadedState() },
        );

    it('should render the fee row with its testID for a Bitcoin account', async () => {
        const { getByTestId } = await renderRow();

        expect(getByTestId('@transactionManagement/fee-selector-row')).toBeOnTheScreen();
    });

    it('should render the crypto fee amount formatter', async () => {
        const { getByTestId } = await renderRow();

        expect(getByTestId('@transactionManagement/fee-crypto-amount')).toBeOnTheScreen();
    });

    it('should render nothing when the account is not in the store', async () => {
        const missingAccountKey = mockAccountKey({
            symbol: btcSymbol,
            descriptor: 'unknownAccount',
        });

        const { toJSON } = await renderWithStoreProvider(
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

    it('should render an alert when fees are unavailable and a form draft is set', async () => {
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

        const { queryByTestId, getByText } = await renderWithStoreProvider(
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
