import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { getTranslation } from '@suite-native/intl';
import { userEvent } from '@suite-native/test-utils-store';
import { banxaCreditCardSellQuote, createPrecomposedTxFinal } from '@suite-native/trading-fixtures';

import { SellCompletionConfirmButton } from './SellCompletionConfirmButton';
import { renderWithTradingProvider } from '../../../test-utils/tradingTestUtils';

const ethSymbol = asNetworkSymbol('eth');

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ navigate: mockNavigate }),
}));

const ethAccountKey = mockAccountKey({ symbol: ethSymbol, descriptor: 'eth1normal' });

describe('SellCompletionConfirmButton', () => {
    const renderSellCompletionButton = async (precomposedTx: Record<string, unknown> | undefined) =>
        await renderWithTradingProvider(
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

    it('renders only when the transaction is final', async () => {
        expect((await renderSellCompletionButton({ type: 'composing' })).toJSON()).toBeNull();

        const { getByText } = await renderSellCompletionButton(
            createPrecomposedTxFinal({ totalSpent: '1100', fee: '1000' }),
        );

        expect(
            getByText(
                getTranslation('moduleTrading.tradingSellCompletionScreen.confirmOnTrezorAndSend'),
            ),
        ).toBeOnTheScreen();
    });

    it('does not render when there is not final type', async () => {
        const { toJSON } = await renderWithTradingProvider(
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
        const { getByText } = await renderSellCompletionButton(
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
