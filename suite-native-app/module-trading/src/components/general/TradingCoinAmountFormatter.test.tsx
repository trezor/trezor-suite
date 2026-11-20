import { type CryptoId } from 'invity-api';

import { TradingTokenMetadataProvider } from '@suite-common/trading';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';
import { btcAsset, getEthAccount, getWalletState, usdcAsset } from '@suite-native/trading-fixtures';

import {
    TradingCoinAmountFormatter,
    type TradingCoinAmountFormatterProps,
} from './TradingCoinAmountFormatter';

describe('TradingCoinAmountFormatter', () => {
    const renderTradingCoinAmountFormatter = (
        props: Partial<TradingCoinAmountFormatterProps> = {},
    ) =>
        renderWithStoreProvider(
            <TradingTokenMetadataProvider>
                <TradingCoinAmountFormatter {...props} />
            </TradingTokenMetadataProvider>,
            {
                preloadedState: { wallet: getWalletState() },
            },
        );

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

    it("shows a held token's symbol from the account, not from the trading catalog", async () => {
        const heldUsdcAccount = getEthAccount({
            tokens: [
                {
                    standard: 'ERC20',
                    name: 'USD Coin',
                    contract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                    symbol: 'USDC.e',
                    decimals: 6,
                    balance: '1',
                },
            ],
        });
        const { getByText } = await renderWithStoreProvider(
            <TradingTokenMetadataProvider>
                <TradingCoinAmountFormatter amount="123456" cryptoId={usdcAsset.cryptoId} />
            </TradingTokenMetadataProvider>,
            {
                preloadedState: {
                    wallet: {
                        ...getWalletState(),
                        accounts: [heldUsdcAccount],
                    },
                },
            },
        );

        expect(getByText('123,456 USDC.e')).toBeOnTheScreen();
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
