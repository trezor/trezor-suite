import type { CryptoId } from 'invity-api';

import { renderWithStoreProvider } from '@suite-native/test-utils-store';
import { btcAsset, getWalletState, usdcAsset } from '@suite-native/trading-fixtures';

import {
    TradingCoinAmountFormatter,
    type TradingCoinAmountFormatterProps,
} from '../TradingCoinAmountFormatter';

describe('TradingCoinAmountFormatter', () => {
    const renderTradingCoinAmountFormatter = (
        props: Partial<TradingCoinAmountFormatterProps> = {},
    ) =>
        renderWithStoreProvider(<TradingCoinAmountFormatter {...props} />, {
            preloadedState: { wallet: getWalletState() },
            providers: ['intl', 'formatter'],
        });

    it('should render formatted value for network', () => {
        const { getByText } = renderTradingCoinAmountFormatter({
            amount: '123456',
            cryptoId: btcAsset.cryptoId,
        });

        expect(getByText('123,456 BTC')).toBeOnTheScreen();
    });

    it('should render formatted value for token', () => {
        const { getByText } = renderTradingCoinAmountFormatter({
            amount: '123456',
            cryptoId: usdcAsset.cryptoId,
        });

        expect(getByText('123,456 USDC')).toBeOnTheScreen();
    });

    it('should render null when cryptoId is undefined', () => {
        const { toJSON } = renderTradingCoinAmountFormatter();

        expect(toJSON()).toBeNull();
    });

    it('should render null when cryptoId is unknown', () => {
        const { toJSON } = renderTradingCoinAmountFormatter({
            cryptoId: 'unknown-crypto-id' as CryptoId,
        });

        expect(toJSON()).toBeNull();
    });

    it('should render 0 value when amount is undefined', () => {
        const { getByText } = renderTradingCoinAmountFormatter({
            cryptoId: btcAsset.cryptoId,
        });

        expect(getByText('0 BTC')).toBeOnTheScreen();
    });
});
