import type { SellFiatTrade } from 'invity-api';

import type { TradingTransactionSell } from '@suite-common/trading';
import { getTranslation } from '@suite-native/intl';
import { act, waitFor } from '@suite-native/test-utils-store';
import {
    createPrecomposedTxFinal,
    eth1NormalAccount,
    getInitializedTradingState,
    moonpayCreditCardSellQuote,
    sellMoonpay,
} from '@suite-native/trading-fixtures';
import { type ProviderConfirmationStatus } from '@suite-native/trading-types';

import { TradingSellCompletionScreen } from './TradingSellCompletionScreen';
import { renderWithTradingProvider } from '../test-utils/tradingTestUtils';

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ setOptions: jest.fn(), navigate: jest.fn() }),
    useRoute: () => ({ name: 'TradingSellCompletion' }),
}));

const mockDoBankAccountVerificationCheck = jest.fn();
const mockComposeTradingTransaction = jest.fn();
const mockClearTradingStateThunk = jest.fn(() => ({ type: 'trading/clear' }));

jest.mock('../hooks/sell/useSellFlow', () => ({
    useSellFlow: () => ({
        txnErrorString: null,
        doBankAccountVerificationCheck: mockDoBankAccountVerificationCheck,
        composeTradingTransaction: mockComposeTradingTransaction,
    }),
}));

const mockUseTradingDetailData = {
    trade: undefined as TradingTransactionSell | undefined,
};

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    useTradingDetailData: () => mockUseTradingDetailData,
}));

jest.mock('../hooks/general/useWatchTrade', () => ({
    useWatchTrade: jest.fn(),
}));

jest.mock('../thunks', () => ({
    ...jest.requireActual('../thunks'),
    clearTradingStateThunk: () => mockClearTradingStateThunk(),
}));

let mockIsDeviceConnected = true;
jest.mock('@suite-common/device', () => ({
    ...jest.requireActual('@suite-common/device'),
    selectIsDeviceConnected: () => mockIsDeviceConnected,
}));

describe('TradingSellCompletionScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseTradingDetailData.trade = undefined;
        mockIsDeviceConnected = true;
    });

    const renderScreen = async ({
        status,
        withFinalTransaction = false,
        providerConfirmationStatus = 'window_closed_with_success',
    }: {
        status?: SellFiatTrade['status'];
        withFinalTransaction?: boolean;
        providerConfirmationStatus?: ProviderConfirmationStatus;
    } = {}) => {
        const tradingState = getInitializedTradingState('sell');
        tradingState.sell.selectedQuote = { ...moonpayCreditCardSellQuote, status };
        tradingState.sell.tradingAccountKey = eth1NormalAccount.key;
        tradingState.currentProviderMetadata = sellMoonpay;
        tradingState.providerConfirmationStatus = providerConfirmationStatus;

        const result = renderWithTradingProvider(<TradingSellCompletionScreen />, {
            tradeType: 'sell',
            overrides: {
                wallet: {
                    trading: tradingState,
                    ...(withFinalTransaction && {
                        send: {
                            precomposedTx: createPrecomposedTxFinal({
                                totalSpent: '1100',
                                fee: '1000',
                                feePerByte: '100',
                                bytes: 1,
                            }),
                        },
                    }),
                },
            },
        });

        await act(() => Promise.resolve());

        return result;
    };

    it('starts provider verification and displays completion copy', async () => {
        const { getByText } = await renderScreen();

        await waitFor(() => expect(mockDoBankAccountVerificationCheck).toHaveBeenCalledTimes(1));
        expect(
            getByText(
                getTranslation('moduleTrading.tradingSellCompletionScreen.finishingTitle', {
                    companyName: sellMoonpay.companyName,
                }),
            ),
        ).toBeOnTheScreen();
    });

    it('composes once and renders Trezor confirmation when SEND_CRYPTO is ready', async () => {
        const { getByText } = await renderScreen({
            status: 'SEND_CRYPTO',
            withFinalTransaction: true,
        });

        await waitFor(() => expect(mockComposeTradingTransaction).toHaveBeenCalledTimes(1));
        expect(
            getByText(
                getTranslation('moduleTrading.tradingSellCompletionScreen.confirmOnTrezorAndSend'),
            ),
        ).toBeOnTheScreen();
    });

    it('keeps finishing copy while provider confirmation is pending', async () => {
        const { getByText, queryByText } = await renderScreen({ status: 'SEND_CRYPTO' });

        await waitFor(() => expect(mockComposeTradingTransaction).toHaveBeenCalledTimes(1));
        expect(
            queryByText(
                getTranslation('moduleTrading.tradingSellCompletionScreen.sendTitle', {
                    cryptoSymbol: 'ETH',
                    companyName: sellMoonpay.companyName,
                }),
            ),
        ).toBeNull();
        expect(
            getByText(
                getTranslation('moduleTrading.tradingSellCompletionScreen.finishingTitle', {
                    companyName: sellMoonpay.companyName,
                }),
            ),
        ).toBeOnTheScreen();
        expect(
            queryByText(
                getTranslation('moduleTrading.tradingSellCompletionScreen.confirmOnTrezorAndSend'),
            ),
        ).toBeNull();
    });

    it('shows the send header immediately when there is no confirmation animation', async () => {
        const { getByText } = await renderScreen({
            status: 'SEND_CRYPTO',
            providerConfirmationStatus: 'confirmation_success',
        });

        expect(
            getByText(
                getTranslation('moduleTrading.tradingSellCompletionScreen.sendTitle', {
                    cryptoSymbol: 'ETH',
                    companyName: sellMoonpay.companyName,
                }),
            ),
        ).toBeOnTheScreen();
    });

    it('composes only once for the same order', async () => {
        const { rerender } = await renderScreen({ status: 'SEND_CRYPTO' });

        await waitFor(() => expect(mockComposeTradingTransaction).toHaveBeenCalledTimes(1));
        rerender(<TradingSellCompletionScreen />);

        expect(mockComposeTradingTransaction).toHaveBeenCalledTimes(1);
    });

    it('shows provider failure and no confirmation for a failed trade', async () => {
        const { getByText, queryByText } = await renderScreen({
            status: 'ERROR',
            withFinalTransaction: true,
        });

        expect(
            getByText(
                getTranslation(
                    'moduleTrading.tradingSellPreviewScreen.providerStatus.cannotBeCompletedAlert.title',
                ),
            ),
        ).toBeOnTheScreen();
        expect(
            queryByText(
                getTranslation('moduleTrading.tradingSellCompletionScreen.confirmOnTrezorAndSend'),
            ),
        ).toBeNull();
    });

    it('clears trading state when the completion flow exits', async () => {
        const { unmount } = await renderScreen();

        expect(mockClearTradingStateThunk).not.toHaveBeenCalled();
        unmount();

        expect(mockClearTradingStateThunk).toHaveBeenCalledTimes(1);
    });

    it('shows device guard when device is disconnected', async () => {
        mockIsDeviceConnected = false;
        const { getByText } = await renderScreen();

        expect(
            getByText(getTranslation('moduleConnectDevice.connectAndUnlockScreen.title')),
        ).toBeOnTheScreen();
    });
});
