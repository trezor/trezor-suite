import { type CryptoId, type SellFiatTrade } from 'invity-api';

import { type TradingSellInfoSelector } from '@suite-common/trading';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { buildSellReturnUrl } from './buildSellReturnUrl';

const mockCreateQuoteLink = jest.fn((..._args: unknown[]) => Promise.resolve('https://return.url'));
jest.mock('src/utils/wallet/trading/sellUtils', () => ({
    ...jest.requireActual('src/utils/wallet/trading/sellUtils'),
    createQuoteLink: (...args: unknown[]) => mockCreateQuoteLink(...args),
}));

const ACCOUNT: Account = mockWalletAccount({
    symbol: asNetworkSymbol('btc'),
    descriptor: asAccountDescriptor('btcAccount'),
});

const QUOTE: SellFiatTrade = {
    exchange: 'cexdirect',
    orderId: 'order-1',
    paymentMethod: 'bankTransfer',
    country: 'DE',
    fiatCurrency: 'EUR',
    cryptoCurrency: 'bitcoin' as CryptoId,
    cryptoStringAmount: '0.01',
    amountInCrypto: true,
};

const QUOTES_REQUEST = {
    country: 'DE',
    fiatCurrency: 'EUR',
    cryptoCurrency: 'bitcoin' as CryptoId,
    amountInCrypto: true,
};

const COMPOSED_INFO = { selectedFee: 'normal' as const, composed: undefined };

const sellInfoWith = (flow: string): TradingSellInfoSelector =>
    ({ providerInfos: { cexdirect: { flow } } }) as unknown as TradingSellInfoSelector;

const PARAMS = {
    quote: QUOTE,
    sellInfo: sellInfoWith('PAYMENT_GATE'),
    quotesRequest: QUOTES_REQUEST,
    account: ACCOUNT,
    composedInfo: COMPOSED_INFO,
};

describe('buildSellReturnUrl', () => {
    beforeEach(() => {
        mockCreateQuoteLink.mockClear();
    });

    it('builds the return url via createQuoteLink with the PAYMENT_GATE order id', async () => {
        const returnUrl = await buildSellReturnUrl(PARAMS);

        expect(returnUrl).toBe('https://return.url');
        expect(mockCreateQuoteLink).toHaveBeenCalledWith(
            expect.objectContaining({
                country: 'DE',
                fiatCurrency: 'EUR',
                cryptoCurrency: 'bitcoin',
                paymentMethod: 'bankTransfer',
            }),
            ACCOUNT,
            COMPOSED_INFO,
            'order-1',
        );
    });

    it('passes no order id for a non PAYMENT_GATE provider', async () => {
        await buildSellReturnUrl({ ...PARAMS, sellInfo: sellInfoWith('DEFAULT') });

        expect(mockCreateQuoteLink).toHaveBeenCalledWith(
            expect.objectContaining({
                country: 'DE',
                fiatCurrency: 'EUR',
                cryptoCurrency: 'bitcoin',
                paymentMethod: 'bankTransfer',
            }),
            ACCOUNT,
            COMPOSED_INFO,
            undefined,
        );
    });

    it('returns undefined when the quotes request is missing', async () => {
        const returnUrl = await buildSellReturnUrl({ ...PARAMS, quotesRequest: undefined });

        expect(returnUrl).toBeUndefined();
        expect(mockCreateQuoteLink).not.toHaveBeenCalled();
    });

    it('returns undefined when no account is resolved', async () => {
        const returnUrl = await buildSellReturnUrl({ ...PARAMS, account: undefined });

        expect(returnUrl).toBeUndefined();
        expect(mockCreateQuoteLink).not.toHaveBeenCalled();
    });

    it('returns undefined when the provider is unknown', async () => {
        const returnUrl = await buildSellReturnUrl({
            ...PARAMS,
            sellInfo: { providerInfos: {} } as TradingSellInfoSelector,
        });

        expect(returnUrl).toBeUndefined();
        expect(mockCreateQuoteLink).not.toHaveBeenCalled();
    });
});
