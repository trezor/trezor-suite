import { getTranslation } from '@suite-native/intl';
import { userEvent } from '@suite-native/test-utils-store';
import { banxaCreditCardSellQuote, eth1NormalAccount } from '@suite-native/trading-fixtures';

import { SellPreviewContinueButton } from './SellPreviewContinueButton';
import { renderWithTradingProvider } from '../../../test-utils/tradingTestUtils';

const mockReplace = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ replace: mockReplace }),
}));

describe('SellPreviewContinueButton', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const renderButton = (withRequiredState = true) =>
        renderWithTradingProvider(<SellPreviewContinueButton companyName="Banxa" />, {
            tradeType: 'sell',
            overrides: withRequiredState
                ? {
                      wallet: {
                          trading: {
                              sell: {
                                  selectedQuote: banxaCreditCardSellQuote,
                                  tradingAccountKey: eth1NormalAccount.key,
                              },
                          },
                      },
                  }
                : undefined,
        });

    it('renders provider CTA', () => {
        const { getByText } = renderButton();

        expect(
            getByText(
                getTranslation('moduleTrading.tradingSellPreviewScreen.sellVia', {
                    companyName: 'Banxa',
                }),
            ),
        ).toBeOnTheScreen();
    });

    it('replaces preview with completion screen', async () => {
        const { getByText } = renderButton();

        await userEvent.press(
            getByText(
                getTranslation('moduleTrading.tradingSellPreviewScreen.sellVia', {
                    companyName: 'Banxa',
                }),
            ),
        );

        expect(mockReplace).toHaveBeenCalledWith('TradingSellCompletion');
    });

    it('is disabled without a quote and account', () => {
        const { getByText } = renderButton(false);

        expect(
            getByText(
                getTranslation('moduleTrading.tradingSellPreviewScreen.sellVia', {
                    companyName: 'Banxa',
                }),
            ),
        ).toBeDisabled();
    });
});
