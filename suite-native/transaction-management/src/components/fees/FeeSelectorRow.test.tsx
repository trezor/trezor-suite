import { asNetworkSymbol } from '@suite-common/wallet-config';
import type { FormState } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { getTranslation } from '@suite-native/intl';
import { fireEvent, renderWithStoreProvider, within } from '@suite-native/test-utils-store';

import { FeeSelectorRow } from './FeeSelectorRow';
import { BTC_ACCOUNT_KEY, getWalletState } from '../../__fixtures__/walletState';

const noopThunk = jest.fn();
const mockOpenModal = jest.fn();

jest.mock('@suite-native/atoms', () => ({
    ...jest.requireActual('@suite-native/atoms'),
    useBottomSheetModal: () => ({
        bottomSheetRef: { current: null },
        openModal: mockOpenModal,
        closeModal: jest.fn(),
    }),
}));

const btcSymbol = asNetworkSymbol('btc');

describe('FeeSelectorRow', () => {
    const getPreloadedState = () => ({
        wallet: getWalletState(),
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const renderRow = ({ isReadOnly }: { isReadOnly?: boolean } = {}) =>
        renderWithStoreProvider(
            <FeeSelectorRow
                accountKey={BTC_ACCOUNT_KEY}
                updateThunk={noopThunk}
                selectedFee="normal"
                formDraft={null}
                isReadOnly={isReadOnly}
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

    it('should open the fee levels on press', async () => {
        const { getByTestId } = await renderRow();

        fireEvent.press(getByTestId('@transactionManagement/fee-selector-row'));

        expect(mockOpenModal).toHaveBeenCalledTimes(1);
    });

    it('should not open the fee levels on press when read-only', async () => {
        const { getByTestId } = await renderRow({ isReadOnly: true });

        fireEvent.press(getByTestId('@transactionManagement/fee-selector-row'));

        expect(getByTestId('@transactionManagement/fee-crypto-amount')).toBeOnTheScreen();
        expect(mockOpenModal).not.toHaveBeenCalled();
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

    it.each([
        {
            error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE',
            message:
                'transactionManagement.precomposedTransaction.errors.amountNotEnoughCurrencyFee',
        },
        { error: 'TR_GENERIC_ERROR_TITLE', message: 'moduleSend.fees.unavailable' },
    ] as const)(
        'describes $error below the accessible fee selector',
        async ({ error, message }) => {
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
                                error,
                            },
                        },
                    },
                },
            };

            const { queryByTestId } = await renderWithStoreProvider(
                <FeeSelectorRow
                    accountKey={BTC_ACCOUNT_KEY}
                    updateThunk={noopThunk}
                    selectedFee="normal"
                    formDraft={{} as FormState}
                />,
                { preloadedState },
            );

            expect(queryByTestId('@transactionManagement/fee-selector-row')).toBeOnTheScreen();
            await fireEvent.press(queryByTestId('@transactionManagement/fee-selector-row')!);
            expect(mockOpenModal).toHaveBeenCalledTimes(1);
            expect(
                within(queryByTestId('@transactionManagement/fee-unavailable-alert')!).getByText(
                    getTranslation(message, { networkDisplaySymbol: 'BTC' }),
                ),
            ).toBeOnTheScreen();
        },
    );
});
