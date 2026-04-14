import { type AccountKey } from '@suite-common/wallet-types';
import { type PreloadedState, renderWithStoreProvider } from '@suite-native/test-utils';
import {
    btc1NormalAccount,
    getWalletState,
    mercuryoFixedWorstQuote,
} from '@suite-native/trading-fixtures';

import {
    ExchangeToAccountTradePreviewCard,
    type ExchangeToAccountTradePreviewCardProps,
} from '../ExchangeToAccountTradePreviewCard';

describe('ExchangeToAccountTradePreviewCard', () => {
    const renderExchangeToAccountTradePreviewCard = (
        props: Partial<ExchangeToAccountTradePreviewCardProps> = {},
        receiveAccountKey = btc1NormalAccount.key,
    ) => {
        const preloadedState: PreloadedState = {
            wallet: getWalletState({ tradeType: 'exchange' }),
        };
        preloadedState.wallet!.trading!.composedTransactionInfo = { composed: { fee: '1000' } };
        preloadedState.wallet!.trading!.exchange!.receiveAccountKey = receiveAccountKey;

        return renderWithStoreProvider(<ExchangeToAccountTradePreviewCard {...props} />, {
            preloadedState,
        });
    };

    it('should render nothing when there is no quote', () => {
        const { toJSON } = renderExchangeToAccountTradePreviewCard({});

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when account is not found', () => {
        const { toJSON } = renderExchangeToAccountTradePreviewCard(
            { quote: mercuryoFixedWorstQuote },
            'unknown-account-key' as AccountKey,
        );

        expect(toJSON()).toBeNull();
    });

    it('should render TradeSideCard otherwise', () => {
        const { getByText } = renderExchangeToAccountTradePreviewCard({
            quote: mercuryoFixedWorstQuote,
        });

        expect(getByText('To')).toBeOnTheScreen();
        expect(getByText('+0.00083554 BTC')).toBeOnTheScreen();
        expect(getByText(`0.00083554-${mercuryoFixedWorstQuote.receive}`)).toBeOnTheScreen();
    });

    // Todo: https://github.com/trezor/trezor-suite/issues/24906
    it.skip('should render correct account name', () => {
        const { getByText } = renderExchangeToAccountTradePreviewCard({
            quote: mercuryoFixedWorstQuote,
        });

        expect(getByText('BTC Account #1')).toBeOnTheScreen();
    });
});
