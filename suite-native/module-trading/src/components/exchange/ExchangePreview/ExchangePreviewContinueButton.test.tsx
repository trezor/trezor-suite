import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { getTranslation } from '@suite-native/intl';
import { userEvent } from '@suite-native/test-utils-store';
import { createPrecomposedTxFinal, mercuryoFixedWorstQuote } from '@suite-native/trading-fixtures';
import { mergeDeepObject } from '@trezor/utils';

import {
    ExchangePreviewContinueButton,
    type ExchangePreviewContinueButtonProps,
} from './ExchangePreviewContinueButton';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderWithTradingProvider,
} from '../../../test-utils/tradingTestUtils';

const btcSymbol = asNetworkSymbol('btc');
const ethSymbol = asNetworkSymbol('eth');

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
        navigate: mockNavigate,
    }),
}));

const btcAccountKey = mockAccountKey({ symbol: btcSymbol, descriptor: 'btc1normal' });
const ethAccountKey = mockAccountKey({ symbol: ethSymbol, descriptor: 'eth1normal' });

describe('ExchangePreviewContinueButton', () => {
    const baseOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {
        wallet: {
            trading: {
                exchange: {
                    tradingAccountKey: btcAccountKey,
                    receiveAccountKey: ethAccountKey,
                    selectedQuote: mercuryoFixedWorstQuote,
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

    const renderExchangePreviewContinueButton = async (
        props: Partial<ExchangePreviewContinueButtonProps> = {},
        extraOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
    ) =>
        await renderWithTradingProvider(
            <ExchangePreviewContinueButton
                isDisabled={false}
                onSignTransactionNavigation={jest.fn()}
                {...props}
            />,
            {
                tradeType: 'exchange',
                overrides: mergeDeepObject(baseOverrides, extraOverrides),
            },
        );

    beforeEach(() => {
        jest.restoreAllMocks();
    });

    it('should render disabled button when precomposed transaction is not in final state', async () => {
        const { getByText } = await renderExchangePreviewContinueButton(
            {},
            { wallet: { send: { precomposedTx: { type: 'composing' } as any } } },
        );

        expect(getByText(getTranslation('generic.buttons.continue'))).toBeDisabled();
    });

    it('should render continue button', async () => {
        const { getByText } = await renderExchangePreviewContinueButton();

        expect(getByText(getTranslation('generic.buttons.continue'))).toBeOnTheScreen();
    });

    it('should render disabled button when isDisabled prop is specified', async () => {
        const { getByText } = await renderExchangePreviewContinueButton({ isDisabled: true });

        expect(getByText(getTranslation('generic.buttons.continue'))).toBeDisabled();
    });

    it('should keep continue button enabled when dex quote approval prefetch is loading', async () => {
        const { getByTestId, queryByTestId } = await renderExchangePreviewContinueButton(
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

    it('should render nothing when quote is finalized', async () => {
        const { toJSON } = await renderExchangePreviewContinueButton(
            {},
            {
                wallet: {
                    trading: {
                        exchange: {
                            selectedQuote: { ...mercuryoFixedWorstQuote, status: 'SUCCESS' },
                        },
                    },
                },
            },
        );

        expect(toJSON()).toBeNull();
    });

    it('should fire console.warn and do not navigate when quote is not specified', async () => {
        const mockOnSignTransactionNavigation = jest.fn();
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const { getByText } = await renderExchangePreviewContinueButton(
            { onSignTransactionNavigation: mockOnSignTransactionNavigation },
            {
                wallet: {
                    trading: {
                        exchange: { selectedQuote: undefined },
                    },
                },
            },
        );

        await userEvent.press(getByText(getTranslation('generic.buttons.continue')));

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
        const { getByText } = await renderExchangePreviewContinueButton(
            { onSignTransactionNavigation: mockOnSignTransactionNavigation },
            {
                wallet: {
                    trading: {
                        exchange: {
                            tradingAccountKey: mockAccountKey({ descriptor: 'nonExistingKey' }),
                        },
                    },
                },
            },
        );

        await userEvent.press(getByText(getTranslation('generic.buttons.continue')));

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
        const { getByText } = await renderExchangePreviewContinueButton({
            onSignTransactionNavigation: mockOnSignTransactionNavigation,
        });

        await userEvent.press(getByText(getTranslation('generic.buttons.continue')));

        expect(consoleWarnSpy).not.toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('TradingExchangeOutputsReview', {
            accountKey: btcAccountKey,
            orderId: mercuryoFixedWorstQuote.orderId,
            tokenContract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            flowType: 'swap',
        });
        expect(mockOnSignTransactionNavigation).toHaveBeenCalledTimes(1);
    });

    it('should navigate with flowType sign-data when formStep is SIGN_DATA', async () => {
        const mockOnSignTransactionNavigation = jest.fn();
        const { getByText } = await renderExchangePreviewContinueButton(
            { onSignTransactionNavigation: mockOnSignTransactionNavigation },
            {
                wallet: {
                    trading: {
                        exchange: {
                            formStep: 'SIGN_DATA',
                        },
                    },
                },
            },
        );

        await userEvent.press(getByText(getTranslation('generic.buttons.continue')));

        expect(mockNavigate).toHaveBeenCalledWith('TradingExchangeOutputsReview', {
            accountKey: btcAccountKey,
            orderId: mercuryoFixedWorstQuote.orderId,
            tokenContract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            flowType: 'sign-data',
        });
        expect(mockOnSignTransactionNavigation).toHaveBeenCalledTimes(1);
    });
});
