import { type CryptoId } from 'invity-api';

import { configureMockStore, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { type TradingAssetSellOption } from '@suite-common/trading';
import { type BaseCurrencyOption } from '@suite-common/wallet-types';
import { mockAccountKey, mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { useTradingSendAssetBalance } from '../useTradingSendAssetBalance';

jest.mock('src/hooks/wallet/trading/form/common/useTradingAssetDecimals', () => ({
    useTradingAssetDecimals: () => ({ getAssetDecimals: () => 8 }),
}));

jest.mock('src/hooks/wallet/trading/form/common/useTradingFiatValues', () => ({
    useTradingFiatValues: () => ({ fiatRate: { rate: 50000 }, fiatRatesUpdater: jest.fn() }),
}));

const ACCOUNT = mockWalletAccount({ symbol: 'btc', formattedBalance: '2' });
const EMPTY_ACCOUNT = mockWalletAccount({ symbol: 'btc', formattedBalance: '0' });

const SEND_CRYPTO_SELECT: TradingAssetSellOption = {
    id: 'bitcoin' as CryptoId,
    isNativeToken: true,
    name: 'Bitcoin',
    coingeckoId: 'bitcoin',
    contractAddress: null,
    symbol: 'btc',
    displaySymbol: 'BTC',
    networkName: 'Bitcoin',
    networkSymbol: 'btc',
    accountKey: mockAccountKey({ descriptor: 'descriptor123', symbol: 'btc' }),
};

const OUTPUT_CURRENCY: BaseCurrencyOption = { value: 'usd', label: 'USD' };

const renderSendAssetBalance = (account = ACCOUNT) => {
    const store = configureMockStore({
        preloadedState: { wallet: { accounts: [account] } },
    });

    return renderHookWithStoreProvider(
        () =>
            useTradingSendAssetBalance({
                account,
                sendCryptoSelect: SEND_CRYPTO_SELECT,
                tokenAddress: null,
                outputCurrency: OUTPUT_CURRENCY,
                composedLevels: undefined,
                composedTransactionInfo: { selectedFee: undefined },
            }),
        { store },
    );
};

describe('useTradingSendAssetBalance', () => {
    it('reports a non-zero balance for a funded native account', () => {
        const { result } = renderSendAssetBalance();

        expect(result.current.isBalanceZero).toBe(false);
    });

    it('reports a zero balance for an empty native account', () => {
        const { result } = renderSendAssetBalance(EMPTY_ACCOUNT);

        expect(result.current.isBalanceZero).toBe(true);
    });

    it('resolves the network decimals from the send-crypto selection', () => {
        const { result } = renderSendAssetBalance();

        expect(result.current.networkDecimals).toBe(8);
    });

    it('derives the composed fee in units (0 when nothing is composed)', () => {
        const { result } = renderSendAssetBalance();

        expect(result.current.feeInUnits).toBe('0');
    });
});
