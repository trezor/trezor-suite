import { PreloadedState, renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { exchangeQuotes } from '../../../../__fixtures__/exchangeQuotes';
import { getWalletState } from '../../../../__fixtures__/walletState';
import {
    ExchangeToAccountTradePreviewCard,
    ExchangeToAccountTradePreviewCardProps,
} from '../ExchangeToAccountTradePreviewCard';

describe('ExchangeToAccountTradePreviewCard', () => {
    const renderExchangeToAccountTradePreviewCard = (
        props: Partial<ExchangeToAccountTradePreviewCardProps> = {},
        receiveAccountKey = 'btc-account-1',
    ) => {
        const preloadedState: PreloadedState = {
            wallet: getWalletState({ tradeType: 'exchange' }),
        };
        preloadedState.wallet!.trading!.composedTransactionInfo = { composed: { fee: '1000' } };
        preloadedState.wallet!.trading!.exchange!.receiveAccountKey = receiveAccountKey;

        return renderWithStoreProviderAsync(
            <ExchangeToAccountTradePreviewCard toStringValue="100" {...props} />,
            { preloadedState },
        );
    };

    it('should render nothing when there is no quote', async () => {
        const { toJSON } = await renderExchangeToAccountTradePreviewCard({});

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when account is not found', async () => {
        const { toJSON } = await renderExchangeToAccountTradePreviewCard(
            { quote: exchangeQuotes[0] },
            'unknown-account-key',
        );

        expect(toJSON()).toBeNull();
    });

    it('should ExchangeTradePreviewCard otherwise', async () => {
        const { getByText } = await renderExchangeToAccountTradePreviewCard({
            quote: exchangeQuotes[0],
        });

        expect(getByText('Account')).toBeOnTheScreen();
        expect(getByText('BTC Account #1')).toBeOnTheScreen();
        expect(getByText('+100')).toBeOnTheScreen();
    });
});
