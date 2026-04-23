import { type AccountKey } from '@suite-common/wallet-types';
import { userEvent } from '@suite-native/test-utils-store';
import { createPrecomposedTxFinal, mercuryoFixedWorstQuote } from '@suite-native/trading-fixtures';
import { mergeDeepObject } from '@trezor/utils';

import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderWithTradingProvider,
} from '../../../../__tests__/tradingTestUtils';
import {
    ExchangePreviewContinueButton,
    type ExchangePreviewContinueButtonProps,
} from '../ExchangePreviewContinueButton';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
        navigate: mockNavigate,
    }),
}));

describe('ExchangePreviewContinueButton', () => {
    const baseOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {
        wallet: {
            trading: {
                exchange: {
                    tradingAccountKey: 'btc-account-1' as AccountKey,
                    receiveAccountKey: 'eth-account-1' as AccountKey,
                },
            },
            send: {
                precomposedTx: createPrecomposedTxFinal({
                    totalSpent: '1100',
                    fee: '1000',
                    feePerByte: '100',
                    bytes: 1,
                }),
            },
        },
    };

    const renderExchangePreviewContinueButton = (
        props: Partial<ExchangePreviewContinueButtonProps> = {},
        extraOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
    ) =>
        renderWithTradingProvider(
            <ExchangePreviewContinueButton
                isDisabled={false}
                quote={mercuryoFixedWorstQuote}
                onSignTransactionNavigation={jest.fn()}
                {...props}
            />,
            {
                tradeType: 'exchange',
                overrides: mergeDeepObject(baseOverrides, extraOverrides),
                providers: ['intl'],
            },
        );

    beforeEach(() => {
        jest.restoreAllMocks();
    });

    it('should render nothing when precomposed transaction is not in final state', () => {
        const { toJSON } = renderExchangePreviewContinueButton(
            {},
            { wallet: { send: { precomposedTx: { type: 'composing' } as any } } },
        );

        expect(toJSON()).toBeNull();
    });

    it('should render continue button', () => {
        const { getByText } = renderExchangePreviewContinueButton();

        expect(getByText('Continue')).toBeOnTheScreen();
    });

    it('should render disabled button when isDisabled prop is specified', () => {
        const { getByText } = renderExchangePreviewContinueButton({ isDisabled: true });

        expect(getByText('Continue')).toBeDisabled();
    });

    it('should keep continue button enabled when dex quote approval prefetch is loading', () => {
        const { getByTestId, queryByTestId } = renderExchangePreviewContinueButton(
            {},
            {
                wallet: {
                    trading: {
                        exchange: {
                            dexQuoteApprovalPrefetchLoadingQuoteId: mercuryoFixedWorstQuote.quoteId,
                        },
                    },
                },
            },
        );

        expect(getByTestId('@trading/exchange-preview/continue-button')).not.toBeDisabled();
        expect(queryByTestId('@trading/exchange-preview/continue-button/loading')).toBeNull();
    });

    it('should fire console.warn and do not navigate when quote is not specified', async () => {
        const mockOnSignTransactionNavigation = jest.fn();
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const { getByText } = renderExchangePreviewContinueButton({
            quote: undefined,
            onSignTransactionNavigation: mockOnSignTransactionNavigation,
        });

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
        const mockOnSignTransactionNavigation = jest.fn();
        const { getByText } = renderExchangePreviewContinueButton(
            { onSignTransactionNavigation: mockOnSignTransactionNavigation },
            {
                wallet: {
                    trading: {
                        exchange: { tradingAccountKey: 'non-existing-key' as AccountKey },
                    },
                },
            },
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
        const { getByText } = renderExchangePreviewContinueButton({
            onSignTransactionNavigation: mockOnSignTransactionNavigation,
        });

        await userEvent.press(getByText('Continue'));

        expect(consoleWarnSpy).not.toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith({
            name: 'TradingExchangeOutputsReview',
            params: {
                accountKey: 'btc-account-1',
                orderId: mercuryoFixedWorstQuote.orderId,
                tokenContract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                flowType: 'swap',
            },
        });
        expect(mockOnSignTransactionNavigation).toHaveBeenCalledTimes(1);
    });
});
