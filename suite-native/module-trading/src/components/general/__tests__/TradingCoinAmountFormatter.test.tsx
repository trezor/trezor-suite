import type { CryptoId } from 'invity-api';

import { renderWithStoreProviderAsync } from '@suite-native/test-utils/store';
import { btcAsset, getWalletState, usdcAsset } from '@suite-native/trading-fixtures';

import {
    TradingCoinAmountFormatter,
    TradingCoinAmountFormatterProps,
} from '../TradingCoinAmountFormatter';

describe('TradingCoinAmountFormatter', () => {
    const renderTradingCoinAmountFormatter = (
        props: Partial<TradingCoinAmountFormatterProps> = {},
    ) =>
        renderWithStoreProviderAsync(<TradingCoinAmountFormatter {...props} />, {
            preloadedState: { wallet: getWalletState() },
        });

    it('should render formatted value for network', async () => {
        const { getByText } = await renderTradingCoinAmountFormatter({
            amount: '123456',
            cryptoId: btcAsset.cryptoId,
        });

        expect(getByText('123,456 BTC')).toBeOnTheScreen();
    });

    it('should render formatted value for token', async () => {
        const { getByText } = await renderTradingCoinAmountFormatter({
            amount: '123456',
            cryptoId: usdcAsset.cryptoId,
        });

        expect(getByText('123,456 USDC')).toBeOnTheScreen();
    });

    it('should render null when cryptoId is undefined', async () => {
        const { toJSON } = await renderTradingCoinAmountFormatter();

        expect(toJSON()).toBeNull();
    });

    it('should render null when cryptoId is unknown', async () => {
        const { toJSON } = await renderTradingCoinAmountFormatter({
            cryptoId: 'unknown-crypto-id' as CryptoId,
        });

        expect(toJSON()).toBeNull();
    });

    it('should render 0 value when amount is undefined', async () => {
        const { getByText } = await renderTradingCoinAmountFormatter({
            cryptoId: btcAsset.cryptoId,
        });

        expect(getByText('0 BTC')).toBeOnTheScreen();
    });
});
