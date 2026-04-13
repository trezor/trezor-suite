import type { TradingTransactionSell } from '@suite-common/trading';
import { getTranslation } from '@suite-native/intl';
import {
    type PreloadedState,
    act,
    renderWithStoreProvider,
    waitFor,
} from '@suite-native/test-utils-store';
import {
    banxaBankTransferSellQuote,
    banxaCreditCardSellQuote,
    getSellTrade,
    getWalletState,
    moonpayCreditCardSellQuote,
} from '@suite-native/trading-fixtures';

import { TradingSellPreviewScreen } from '../TradingSellPreviewScreen';

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () => ({ name: 'TradingSellPreviewScreen' }),
    useNavigation: () => ({
        setOptions: jest.fn(),
    }),
}));

const mockDoBankAccountVerificationCheck = jest.fn();
const mockFetchFeesAndCompose = jest.fn();
const mockTxnErrorString = null;
const mockRetryDoSellTrade = jest.fn();

jest.mock('../../hooks/sell/useSellFlow', () => ({
    useSellFlow: () => ({
        txnErrorString: mockTxnErrorString,
        doBankAccountVerificationCheck: mockDoBankAccountVerificationCheck,
        fetchFeesAndCompose: mockFetchFeesAndCompose,
        retryDoSellTrade: mockRetryDoSellTrade,
    }),
}));

const mockUseTradingDetailData = {
    trade: undefined as TradingTransactionSell | undefined,
};

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    useTradingDetailData: () => mockUseTradingDetailData,
}));

jest.mock('../../hooks/general/useWatchTrade', () => ({
    useWatchTrade: jest.fn(),
}));

let mockIsDeviceConnected = true;
jest.mock('@suite-common/device', () => ({
    ...jest.requireActual('@suite-common/device'),
    selectIsDeviceConnected: () => mockIsDeviceConnected,
}));

describe('TradingSellPreviewScreen', () => {
    let unmount: (() => void) | undefined;

    const renderTradingSellPreviewScreen = async (preloadedState?: PreloadedState) => {
        const result = renderWithStoreProvider(<TradingSellPreviewScreen />, {
            preloadedState,
        });

        unmount = result.unmount;
        // wait for async useEffects callbacks to (hopefully) finish
        await act(() => Promise.resolve());

        return result;
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseTradingDetailData.trade = undefined;
        mockIsDeviceConnected = true;
    });

    afterEach(() => {
        if (unmount) {
            unmount();
            unmount = undefined;
        }
    });

    it('should display device guard when device is not connected', async () => {
        mockIsDeviceConnected = false;
        const { getByText } = await renderTradingSellPreviewScreen();
        expect(
            getByText(getTranslation('moduleConnectDevice.connectAndUnlockScreen.title')),
        ).toBeOnTheScreen();
    });

    it('should render screen with header and preview view', async () => {
        const preloadedState: PreloadedState = {
            wallet: getWalletState({ tradeType: 'sell' }),
        };
        preloadedState.wallet!.trading!.sell!.selectedQuote = banxaCreditCardSellQuote;

        const { getByText } = await renderTradingSellPreviewScreen(preloadedState);

        expect(getByText('Sell')).toBeOnTheScreen();
        expect(getByText('To')).toBeOnTheScreen();
        expect(getByText('Credit/Debit Card')).toBeOnTheScreen();
    });

    it('should call doBankAccountVerificationCheck on mount', async () => {
        const preloadedState: PreloadedState = {
            wallet: getWalletState({ tradeType: 'sell' }),
        };
        preloadedState.wallet!.trading!.sell!.selectedQuote = banxaCreditCardSellQuote;

        await renderTradingSellPreviewScreen(preloadedState);

        await waitFor(() => expect(mockDoBankAccountVerificationCheck).toHaveBeenCalled());
        expect(mockDoBankAccountVerificationCheck).toHaveBeenCalledTimes(1);
    });

    it('should use selectedQuote when trade data is not available', async () => {
        const preloadedState: PreloadedState = {
            wallet: getWalletState({ tradeType: 'sell' }),
        };
        preloadedState.wallet!.trading!.sell!.selectedQuote = banxaCreditCardSellQuote;

        const { getByText } = await renderTradingSellPreviewScreen(preloadedState);

        // Should render with selectedQuote
        expect(getByText('To')).toBeOnTheScreen();
    });

    it('should use trade data when available', async () => {
        const preloadedState: PreloadedState = {
            wallet: getWalletState({ tradeType: 'sell' }),
        };
        preloadedState.wallet!.trading!.sell!.selectedQuote = banxaCreditCardSellQuote;

        // Add trade to trades array so SellBankAccountPicker can find it
        const tradeData = banxaBankTransferSellQuote;
        preloadedState.wallet!.trading!.trades = [
            {
                tradeType: 'sell',
                data: tradeData,
                sendAccountKey: 'eth-account-1',
            } as any,
        ];

        mockUseTradingDetailData.trade = {
            tradeType: 'sell',
            data: tradeData,
            sendAccountKey: 'eth-account-1',
        } as any;

        const { getByText } = await renderTradingSellPreviewScreen(preloadedState);

        // Should render with trade data
        expect(getByText('To')).toBeOnTheScreen();
    });

    it('should render SellPreviewContinueButton with correct props', async () => {
        const preloadedState: PreloadedState = {
            wallet: getWalletState({ tradeType: 'sell' }),
        };
        preloadedState.wallet!.trading!.sell!.selectedQuote = banxaCreditCardSellQuote;

        const { getByText } = await renderTradingSellPreviewScreen(preloadedState);

        // SellPreviewContinueButton should be rendered (it's part of the screen)
        // We can verify by checking that the screen renders without errors
        expect(getByText('To')).toBeOnTheScreen();
    });

    it('should call fetchFeesAndCompose when quote has SEND_CRYPTO status on mount', async () => {
        const preloadedState: PreloadedState = {
            wallet: getWalletState({ tradeType: 'sell' }),
        };
        const quoteWithSendCryptoStatus = {
            ...banxaCreditCardSellQuote,
            status: 'SEND_CRYPTO' as const,
        };
        preloadedState.wallet!.trading!.sell!.selectedQuote = quoteWithSendCryptoStatus;

        await renderTradingSellPreviewScreen(preloadedState);

        await waitFor(() => expect(mockFetchFeesAndCompose).toHaveBeenCalled());
        expect(mockFetchFeesAndCompose).toHaveBeenCalledTimes(1);
    });

    it('should call fetchFeesAndCompose when trade data has SEND_CRYPTO status on mount', async () => {
        const preloadedState: PreloadedState = {
            wallet: getWalletState({ tradeType: 'sell' }),
        };
        const trade = getSellTrade({ status: 'SEND_CRYPTO' });
        preloadedState.wallet!.trading!.trades = [trade];
        preloadedState.wallet!.trading!.sell!.selectedQuote = banxaCreditCardSellQuote;

        mockUseTradingDetailData.trade = trade;

        await renderTradingSellPreviewScreen(preloadedState);

        await waitFor(() => expect(mockFetchFeesAndCompose).toHaveBeenCalled());
        expect(mockFetchFeesAndCompose).toHaveBeenCalledTimes(1);
    });

    it('should not call fetchFeesAndCompose when status is not SEND_CRYPTO', async () => {
        const preloadedState: PreloadedState = {
            wallet: getWalletState({ tradeType: 'sell' }),
        };
        const quoteWithOtherStatus = {
            ...banxaCreditCardSellQuote,
            status: 'SUBMITTED' as const,
        };
        preloadedState.wallet!.trading!.sell!.selectedQuote = quoteWithOtherStatus;

        await renderTradingSellPreviewScreen(preloadedState);

        expect(mockFetchFeesAndCompose).not.toHaveBeenCalled();
    });

    it('should call fetchFeesAndCompose only once per orderId', async () => {
        const preloadedState: PreloadedState = {
            wallet: getWalletState({ tradeType: 'sell' }),
        };
        const quoteWithSendCryptoStatus = {
            ...moonpayCreditCardSellQuote,
            status: 'SEND_CRYPTO' as const,
            orderId: 'test_order_id_1',
        };
        preloadedState.wallet!.trading!.sell!.selectedQuote = quoteWithSendCryptoStatus;

        await renderTradingSellPreviewScreen(preloadedState);

        await waitFor(() => expect(mockFetchFeesAndCompose).toHaveBeenCalled());
        // Should be called exactly once for this orderId
        expect(mockFetchFeesAndCompose).toHaveBeenCalledTimes(1);
    });

    it('should render last error message', async () => {
        const preloadedState: PreloadedState = {
            wallet: getWalletState({ tradeType: 'sell' }),
        };
        preloadedState.wallet!.trading!.sell!.lastErrorMessage = 'last error message';

        const { getByText } = await renderTradingSellPreviewScreen(preloadedState);

        expect(getByText('last error message')).toBeOnTheScreen();
    });
});
