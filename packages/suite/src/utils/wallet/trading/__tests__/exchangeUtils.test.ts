import { CryptoId, ExchangeTradeQuoteRequest } from 'invity-api';

import { TradingComposedTransactionInfo } from '@suite-common/trading';
import { Account } from '@suite-common/wallet-types';

import { createQuoteLink } from 'src/utils/wallet/trading/exchangeUtils';

describe('exchangeUtils', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    const mockQuotesRequest: ExchangeTradeQuoteRequest = {
        send: 'bitcoin' as CryptoId,
        receive: 'litecoin' as CryptoId,
        sendStringAmount: '1',
    };
    const mockAccount = {
        symbol: 'btc',
        accountType: 'normal',
        index: 1,
    } as Account;
    const mockComposedInfo = {
        selectedFee: 'normal',
        composed: {
            feePerByte: '1',
            maxFeePerGas: '2',
            maxPriorityFeePerGas: '3',
            feeLimit: '4',
        },
    } as TradingComposedTransactionInfo;
    const mockQuoteId = 'quoteId';

    describe('createQuoteLink', () => {
        it('should create link for quote', async () => {
            expect(
                await createQuoteLink(
                    mockQuotesRequest,
                    mockAccount,
                    mockComposedInfo,
                    mockQuoteId,
                ),
            ).toStrictEqual(
                `${window.location.origin}/coinmarket-redirect#exchange-offers/btc/normal/1/bitcoin/litecoin/1/quoteId`,
            );
        });

        it('should create link for quote when selectedFee is high', async () => {
            expect(
                await createQuoteLink(
                    mockQuotesRequest,
                    mockAccount,
                    { ...mockComposedInfo, selectedFee: 'high' },
                    mockQuoteId,
                ),
            ).toStrictEqual(
                `${window.location.origin}/coinmarket-redirect#exchange-offers/btc/normal/1/bitcoin/litecoin/1/quoteId/high`,
            );
        });

        it('should create link for quote when selectedFee is custom', async () => {
            expect(
                await createQuoteLink(
                    mockQuotesRequest,
                    mockAccount,
                    { ...mockComposedInfo, selectedFee: 'custom' },
                    mockQuoteId,
                ),
            ).toStrictEqual(
                `${window.location.origin}/coinmarket-redirect#exchange-offers/btc/normal/1/bitcoin/litecoin/1/quoteId/custom/1/2/3/4`,
            );
        });
    });
});
