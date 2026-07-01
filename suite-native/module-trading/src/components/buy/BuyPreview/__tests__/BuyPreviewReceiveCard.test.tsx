import { getTranslation } from '@suite-native/intl';
import { act } from '@suite-native/test-utils-store';
import { btc1NormalAccount, mercuryoApplePayBuyQuote } from '@suite-native/trading-fixtures';

import { renderWithTradingProvider } from '../../../../__tests__/tradingTestUtils';
import { BuyPreviewReceiveCard } from '../BuyPreviewReceiveCard';

describe('BuyPreviewReceiveCard', () => {
    const withReceiveAccount = {
        wallet: {
            trading: {
                buy: {
                    tradingAccountKey: btc1NormalAccount.key,
                    receiveAddress: btc1NormalAccount.addresses?.used[0]?.address,
                },
            },
        },
    };

    const renderBuyPreviewReceiveCard = async (overrides?: typeof withReceiveAccount) => {
        const result = renderWithTradingProvider(
            <BuyPreviewReceiveCard quote={mercuryoApplePayBuyQuote} />,
            { tradeType: 'buy', overrides },
        );
        await act(() => Promise.resolve());

        return result;
    };

    it('returns null when no receive account is selected', async () => {
        const { toJSON } = await renderBuyPreviewReceiveCard();

        expect(toJSON()).toBeNull();
    });

    it('renders "You get" title', async () => {
        const { getByText } = await renderBuyPreviewReceiveCard(withReceiveAccount);

        expect(
            getByText(getTranslation('moduleTrading.tradingBuyPreviewScreen.youGet')),
        ).toBeOnTheScreen();
    });

    it('renders account label', async () => {
        const { getByText } = await renderBuyPreviewReceiveCard(withReceiveAccount);

        expect(getByText('BTC Account #1')).toBeOnTheScreen();
    });

    it('renders receive amount with plus prefix', async () => {
        const { getByText } = await renderBuyPreviewReceiveCard(withReceiveAccount);

        expect(getByText('+0.00100017 BTC')).toBeOnTheScreen();
    });
});
