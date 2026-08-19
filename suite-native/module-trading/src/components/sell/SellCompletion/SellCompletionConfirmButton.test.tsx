import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { getTranslation } from '@suite-native/intl';
import { userEvent } from '@suite-native/test-utils-store';
import { banxaCreditCardSellQuote, createPrecomposedTxFinal } from '@suite-native/trading-fixtures';

import { SellCompletionConfirmButton } from './SellCompletionConfirmButton';
import { renderWithTradingProvider } from '../../../test-utils/tradingTestUtils';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ navigate: mockNavigate }),
}));

const ethAccountKey = mockAccountKey({ symbol: 'eth', descriptor: 'eth1normal' });

describe('SellCompletionConfirmButton', () => {
    const renderSellCompletionButton = (precomposedTx: Record<string, unknown> | undefined) =>
        renderWithTradingProvider(
            <SellCompletionConfirmButton quote={banxaCreditCardSellQuote} />,
            {
                tradeType: 'sell',
                overrides: {
                    wallet: {
                        trading: { sell: { tradingAccountKey: ethAccountKey } },
                        send: { precomposedTx: precomposedTx as never },
                    },
                },
            },
        );

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders only when the transaction is final', () => {
        expect(renderSellCompletionButton({ type: 'composing' }).toJSON()).toBeNull();

        const { getByText } = renderSellCompletionButton(
            createPrecomposedTxFinal({ totalSpent: '1100', fee: '1000' }),
        );

        expect(
            getByText(
                getTranslation('moduleTrading.tradingSellCompletionScreen.confirmOnTrezorAndSend'),
            ),
        ).toBeOnTheScreen();
    });

    it('does not render when there is not final type', () => {
        const { toJSON } = renderWithTradingProvider(
            <SellCompletionConfirmButton quote={banxaCreditCardSellQuote} />,
            {
                tradeType: 'sell',
                overrides: {
                    wallet: {
                        trading: { sell: { tradingAccountKey: ethAccountKey } },
                        send: { precomposedTx: { type: undefined } },
                    },
                },
            },
        );

        expect(toJSON()).toBeNull();
    });

    it('navigates to outputs review', async () => {
        const { getByText } = renderSellCompletionButton(
            createPrecomposedTxFinal({ totalSpent: '1100', fee: '1000' }),
        );

        await userEvent.press(
            getByText(
                getTranslation('moduleTrading.tradingSellCompletionScreen.confirmOnTrezorAndSend'),
            ),
        );

        expect(mockNavigate).toHaveBeenCalledWith('TradingSellOutputsReview', {
            accountKey: ethAccountKey,
            orderId: banxaCreditCardSellQuote.orderId,
            tokenContract: undefined,
        });
    });
});
