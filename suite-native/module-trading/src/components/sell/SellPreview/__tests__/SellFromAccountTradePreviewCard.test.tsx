import type { CryptoId } from 'invity-api';

import { PreloadedState, renderWithStoreProvider } from '@suite-native/test-utils';
import { getWalletState } from '@suite-native/trading-fixtures';

import {
    SellFromAccountTradePreviewCard,
    SellFromAccountTradePreviewCardProps,
} from '../SellFromAccountTradePreviewCard';

describe('SellFromAccountTradePreviewCard', () => {
    const renderSellFromAccountTradePreviewCard = (
        props: Partial<SellFromAccountTradePreviewCardProps> = {},
        tradingAccountKey = 'eth-account-1',
    ) => {
        const preloadedState: PreloadedState = {
            wallet: getWalletState({ tradeType: 'sell' }),
        };
        preloadedState.wallet!.trading!.sell!.tradingAccountKey = tradingAccountKey;

        return renderWithStoreProvider(
            <SellFromAccountTradePreviewCard fromStringValue="0.0233" {...props} />,
            { preloadedState },
        );
    };

    it('should render nothing when there is no quote', () => {
        const { toJSON } = renderSellFromAccountTradePreviewCard({});

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when account is not found', () => {
        const { toJSON } = renderSellFromAccountTradePreviewCard(
            { cryptoId: 'bitcoin' as CryptoId },
            'unknown-account-key',
        );

        expect(toJSON()).toBeNull();
    });

    it('should render TradeSideCard otherwise', () => {
        const { getByText } = renderSellFromAccountTradePreviewCard({
            cryptoId: 'bitcoin' as CryptoId,
        });

        expect(getByText('From')).toBeOnTheScreen();
        expect(getByText('Ethereum #1')).toBeOnTheScreen();
        expect(getByText('-0.0233')).toBeOnTheScreen();
    });

    it('should render value in fiat when fromValue is provided', () => {
        const { getByText } = renderSellFromAccountTradePreviewCard({
            cryptoId: 'bitcoin' as CryptoId,
            fromValue: '1',
        });

        expect(getByText('1-bitcoin')).toBeOnTheScreen();
    });
});
