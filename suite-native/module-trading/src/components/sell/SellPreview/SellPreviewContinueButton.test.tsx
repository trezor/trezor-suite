import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { getTranslation } from '@suite-native/intl';
import { userEvent } from '@suite-native/test-utils-store';
import { banxaCreditCardSellQuote, createPrecomposedTxFinal } from '@suite-native/trading-fixtures';
import { mergeDeepObject } from '@trezor/utils';

import {
    SellPreviewContinueButton,
    type SellPreviewContinueButtonProps,
} from './SellPreviewContinueButton';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderWithTradingProvider,
} from '../../../__tests__/tradingTestUtils';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
        navigate: mockNavigate,
    }),
}));

const ethAccountKey = mockAccountKey({ symbol: 'eth', descriptor: 'eth1normal' });

describe('SellPreviewContinueButton', () => {
    const baseOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {
        wallet: {
            trading: { sell: { tradingAccountKey: ethAccountKey } },
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

    const renderSellPreviewContinueButton = (
        props: Partial<SellPreviewContinueButtonProps> = {},
        extraOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
    ) =>
        renderWithTradingProvider(
            <SellPreviewContinueButton
                isDisabled={false}
                quote={banxaCreditCardSellQuote}
                onSignTransactionNavigation={jest.fn()}
                {...props}
            />,
            {
                tradeType: 'sell',
                overrides: mergeDeepObject(baseOverrides, extraOverrides),
            },
        );

    beforeEach(() => {
        jest.restoreAllMocks();
    });

    it('should render nothing when precomposed transaction is not in final state', () => {
        const { toJSON } = renderSellPreviewContinueButton(
            {},
            { wallet: { send: { precomposedTx: { type: 'composing' } as any } } },
        );

        expect(toJSON()).toBeNull();
    });

    it('should render continue button', () => {
        const { getByText } = renderSellPreviewContinueButton();

        expect(
            getByText(getTranslation('moduleTrading.tradingScreen.buttons.continue')),
        ).toBeOnTheScreen();
    });

    it('should render disabled button when isDisabled prop is specified', () => {
        const { getByText } = renderSellPreviewContinueButton({ isDisabled: true });

        expect(
            getByText(getTranslation('moduleTrading.tradingScreen.buttons.continue')),
        ).toBeDisabled();
    });

    it('should fire console.warn and do not navigate when quote is not specified', async () => {
        const mockOnSignTransactionNavigation = jest.fn();
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const { getByText } = renderSellPreviewContinueButton({
            quote: undefined,
            onSignTransactionNavigation: mockOnSignTransactionNavigation,
        });

        await userEvent.press(
            getByText(getTranslation('moduleTrading.tradingScreen.buttons.continue')),
        );

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
        const { getByText } = renderSellPreviewContinueButton(
            { onSignTransactionNavigation: mockOnSignTransactionNavigation },
            {
                wallet: {
                    trading: {
                        sell: {
                            tradingAccountKey: mockAccountKey({ descriptor: 'nonExistingKey' }),
                        },
                    },
                },
            },
        );

        await userEvent.press(
            getByText(getTranslation('moduleTrading.tradingScreen.buttons.continue')),
        );

        expect(consoleWarnSpy).toHaveBeenCalledWith('quote or fromAccount is not defined', {
            hasQuote: true,
            hasFromAccount: false,
        });
        expect(mockNavigate).not.toHaveBeenCalled();
        expect(mockOnSignTransactionNavigation).not.toHaveBeenCalled();
    });

    it('should navigate to TradingOutputsReview on continue press', async () => {
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const mockOnSignTransactionNavigation = jest.fn();
        const { getByText } = renderSellPreviewContinueButton({
            onSignTransactionNavigation: mockOnSignTransactionNavigation,
        });

        await userEvent.press(
            getByText(getTranslation('moduleTrading.tradingScreen.buttons.continue')),
        );

        expect(consoleWarnSpy).not.toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('TradingSellOutputsReview', {
            accountKey: ethAccountKey,
            orderId: banxaCreditCardSellQuote.orderId,
            tokenContract: undefined,
        });
        expect(mockOnSignTransactionNavigation).toHaveBeenCalledTimes(1);
    });
});
