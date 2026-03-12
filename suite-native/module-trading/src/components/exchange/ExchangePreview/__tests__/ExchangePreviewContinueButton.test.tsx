import { AccountKey, GeneralPrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { userEvent } from '@suite-native/test-utils';
import { type PreloadedState, renderWithStoreProviderAsync } from '@suite-native/test-utils/store';
import { exchangeQuotes, getWalletState } from '@suite-native/trading-fixtures';

import {
    ExchangePreviewContinueButton,
    ExchangePreviewContinueButtonProps,
} from '../ExchangePreviewContinueButton';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
        navigate: mockNavigate,
    }),
}));

describe('ExchangePreviewContinueButton', () => {
    const renderExchangePreviewContinueButton = (
        props: Partial<ExchangePreviewContinueButtonProps> = {},
        preloadedState: PreloadedState = {},
    ) =>
        renderWithStoreProviderAsync(
            <ExchangePreviewContinueButton
                isDisabled={false}
                quote={exchangeQuotes[0]}
                onSignTransactionNavigation={jest.fn()}
                {...props}
            />,
            { preloadedState },
        );

    beforeEach(() => {
        jest.restoreAllMocks();
    });

    const getPreloadedState = (): PreloadedState => {
        const preloadedState = { wallet: getWalletState({ tradeType: 'exchange' }) };
        preloadedState.wallet!.trading!.exchange!.tradingAccountKey = 'btc-account-1' as AccountKey; // Todo: create properly via `createAccountKey()`
        preloadedState.wallet!.trading!.exchange!.receiveAccountKey = 'eth-account-1' as AccountKey; // Todo: create properly via `createAccountKey()`
        preloadedState.wallet!.send!.precomposedTx = {
            type: 'final',
            totalSpent: '1100',
            fee: '1000',
            feePerByte: '100',
            bytes: 1,
        } as GeneralPrecomposedTransactionFinal;

        return preloadedState;
    };

    it('should render nothing when precomposed transaction is not in final state', async () => {
        const preloadedState = getPreloadedState();
        preloadedState!.wallet!.send!.precomposedTx = {
            type: 'composing',
        } as any;
        const { toJSON } = await renderExchangePreviewContinueButton({}, preloadedState);

        expect(toJSON()).toBeNull();
    });

    it('should render continue button', async () => {
        const { getByText } = await renderExchangePreviewContinueButton({}, getPreloadedState());

        expect(getByText('Continue')).toBeOnTheScreen();
    });

    it('should render disabled button when isDisabled prop is specified', async () => {
        const { getByText } = await renderExchangePreviewContinueButton(
            { isDisabled: true },
            getPreloadedState(),
        );

        expect(getByText('Continue')).toBeDisabled();
    });

    it('should fire console.warn and do not navigate when quote is not specified', async () => {
        const mockOnSignTransactionNavigation = jest.fn();
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const { getByText } = await renderExchangePreviewContinueButton(
            { quote: undefined, onSignTransactionNavigation: mockOnSignTransactionNavigation },
            getPreloadedState(),
        );

        await userEvent.press(getByText('Continue'));

        expect(consoleWarnSpy).toHaveBeenCalledWith('quote or fromAccount is not defined', {
            hasQuote: false,
            hasFromAccount: true,
        });
        expect(mockNavigate).not.toHaveBeenCalled();
        expect(mockOnSignTransactionNavigation).not.toHaveBeenCalled();
    });

    it('should fire console.warn and do not navigate when fromAccount is not found', async () => {
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const preloadedState = getPreloadedState();
        preloadedState!.wallet!.trading!.exchange!.tradingAccountKey = 'non-existing-key';
        const mockOnSignTransactionNavigation = jest.fn();
        const { getByText } = await renderExchangePreviewContinueButton(
            { onSignTransactionNavigation: mockOnSignTransactionNavigation },
            preloadedState,
        );

        await userEvent.press(getByText('Continue'));

        expect(consoleWarnSpy).toHaveBeenCalledWith('quote or fromAccount is not defined', {
            hasQuote: true,
            hasFromAccount: false,
        });
        expect(mockNavigate).not.toHaveBeenCalled();
        expect(mockOnSignTransactionNavigation).not.toHaveBeenCalled();
    });

    it('should navigate to TradingExchangeOutputsReview on continue press', async () => {
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const mockOnSignTransactionNavigation = jest.fn();
        const { getByText } = await renderExchangePreviewContinueButton(
            { onSignTransactionNavigation: mockOnSignTransactionNavigation },
            getPreloadedState(),
        );

        await userEvent.press(getByText('Continue'));

        expect(consoleWarnSpy).not.toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith({
            name: 'TradingExchangeOutputsReview',
            params: {
                accountKey: 'btc-account-1',
                orderId: exchangeQuotes[0].orderId,
                tokenContract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            },
        });
        expect(mockOnSignTransactionNavigation).toHaveBeenCalledTimes(1);
    });
});
