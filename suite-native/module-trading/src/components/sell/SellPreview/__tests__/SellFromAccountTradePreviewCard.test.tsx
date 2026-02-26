import type { CryptoId } from 'invity-api';

// eslint-disable-next-line local-rules/no-package-deep-imports
import { PreloadedState, renderWithStoreProviderAsync } from '@suite-native/test-utils/store';
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

        return renderWithStoreProviderAsync(
            <SellFromAccountTradePreviewCard fromStringValue="0.0233" {...props} />,
            { preloadedState },
        );
    };

    it('should render nothing when there is no quote', async () => {
        const { toJSON } = await renderSellFromAccountTradePreviewCard({});

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when account is not found', async () => {
        const { toJSON } = await renderSellFromAccountTradePreviewCard(
            { cryptoId: 'bitcoin' as CryptoId },
            'unknown-account-key',
        );

        expect(toJSON()).toBeNull();
    });

    it('should render TradeSideCard otherwise', async () => {
        const { getByText } = await renderSellFromAccountTradePreviewCard({
            cryptoId: 'bitcoin' as CryptoId,
        });

        expect(getByText('From')).toBeOnTheScreen();
        expect(getByText('Ethereum #1')).toBeOnTheScreen();
        expect(getByText('-0.0233')).toBeOnTheScreen();
    });
});
