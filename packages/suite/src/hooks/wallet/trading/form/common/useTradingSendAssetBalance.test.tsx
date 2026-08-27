import { type CryptoId } from 'invity-api';

import { configureMockStore, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { type TradingAssetSellOption } from '@suite-common/trading';
import { toNetworkSymbolNonTestnet } from '@suite-common/wallet-config';
import { type BaseCurrencyOption } from '@suite-common/wallet-types';
import {
    mockAccountKey,
    mockAccountToken,
    mockWalletAccount,
} from '@suite-common/wallet-types/mocks';

import { useTradingSendAssetBalance } from './useTradingSendAssetBalance';

const btcSymbol = toNetworkSymbolNonTestnet('btc');
const ethSymbol = toNetworkSymbolNonTestnet('eth');

jest.mock('src/hooks/wallet/trading/form/common/useTradingAssetDecimals', () => ({
    useTradingAssetDecimals: () => ({ getAssetDecimals: () => 8 }),
}));

jest.mock('src/hooks/wallet/trading/form/common/useTradingFiatValues', () => ({
    useTradingFiatValues: () => ({ fiatRate: { rate: 50000 }, fiatRatesUpdater: jest.fn() }),
}));

const ACCOUNT = mockWalletAccount({ symbol: btcSymbol, formattedBalance: '2' });
const EMPTY_ACCOUNT = mockWalletAccount({ symbol: btcSymbol, formattedBalance: '0' });

const TOKEN_CONTRACT = '0x' + 'a'.repeat(40);

const FUNDED_TOKEN_ACCOUNT = mockWalletAccount({
    symbol: ethSymbol,
    formattedBalance: '0',
    tokens: [mockAccountToken({ contract: TOKEN_CONTRACT, balance: '100' })],
});
const EMPTY_TOKEN_ACCOUNT = mockWalletAccount({
    symbol: ethSymbol,
    formattedBalance: '2',
    tokens: [mockAccountToken({ contract: TOKEN_CONTRACT, balance: '0' })],
});

const SEND_CRYPTO_SELECT: TradingAssetSellOption = {
    id: 'bitcoin' as CryptoId,
    isNativeToken: true,
    name: 'Bitcoin',
    coingeckoId: 'bitcoin',
    contractAddress: null,
    symbol: btcSymbol,
    displaySymbol: 'BTC',
    networkName: 'Bitcoin',
    networkSymbol: btcSymbol,
    accountKey: mockAccountKey({ descriptor: 'descriptor123', symbol: btcSymbol }),
};

const OUTPUT_CURRENCY: BaseCurrencyOption = { value: 'usd', label: 'USD' };

const renderSendAssetBalance = (account = ACCOUNT, tokenAddress: string | null = null) => {
    const store = configureMockStore({
        extra: undefined,
        preloadedState: { wallet: { accounts: [account] } },
    });

    return renderHookWithStoreProvider(
        () =>
            useTradingSendAssetBalance({
                account,
                sendCryptoSelect: SEND_CRYPTO_SELECT,
                tokenAddress,
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

    it('reports a non-zero balance from the token data, ignoring the empty native balance', () => {
        const { result } = renderSendAssetBalance(FUNDED_TOKEN_ACCOUNT, TOKEN_CONTRACT);

        expect(result.current.isBalanceZero).toBe(false);
    });

    it('reports a zero balance from the token data, ignoring the funded native balance', () => {
        const { result } = renderSendAssetBalance(EMPTY_TOKEN_ACCOUNT, TOKEN_CONTRACT);

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
