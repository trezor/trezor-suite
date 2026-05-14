import { type TradingComposedTransactionInfo } from '@suite-common/trading';

import { type Account } from 'src/types/wallet';
import * as fixtures from 'src/utils/wallet/trading/__fixtures__/sellUtils';
import { createQuoteLink } from 'src/utils/wallet/trading/sellUtils';

const { QUOTE_REQUEST_FIAT, QUOTE_REQUEST_CRYPTO } = fixtures;

describe('sellUtils', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

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
        it('should create link for quote for fiat', async () => {
            expect(
                await createQuoteLink(
                    QUOTE_REQUEST_FIAT,
                    mockAccount,
                    mockComposedInfo,
                    mockQuoteId,
                ),
            ).toStrictEqual(
                `${window.location.origin}/coinmarket-redirect#sell-offers/btc/normal/1/p-qf/CZ/EUR/10/bitcoin/creditCard/quoteId/custom/1/2/3/4`,
            );
        });

        it('should create link for quote when selectedFee is high', async () => {
            expect(
                await createQuoteLink(
                    QUOTE_REQUEST_CRYPTO,
                    mockAccount,
                    { ...mockComposedInfo, selectedFee: 'high' },
                    mockQuoteId,
                ),
            ).toStrictEqual(
                `${window.location.origin}/coinmarket-redirect#sell-offers/btc/normal/1/p-qc/CZ/EUR/0.001/bitcoin/creditCard/quoteId/custom/1/2/3/4`,
            );
        });

        it('should create link for quote when selectedFee is custom', async () => {
            expect(
                await createQuoteLink(
                    QUOTE_REQUEST_CRYPTO,
                    mockAccount,
                    { ...mockComposedInfo, selectedFee: 'custom' },
                    mockQuoteId,
                ),
            ).toStrictEqual(
                `${window.location.origin}/coinmarket-redirect#sell-offers/btc/normal/1/p-qc/CZ/EUR/0.001/bitcoin/creditCard/quoteId/custom/1/2/3/4`,
            );
        });

        it('should create link for quote when account network type is solana', async () => {
            expect(
                await createQuoteLink(
                    QUOTE_REQUEST_CRYPTO,
                    {
                        ...mockAccount,
                        symbol: 'sol',
                        networkType: 'solana',
                    } as Account,
                    { ...mockComposedInfo, selectedFee: 'normal' },
                    mockQuoteId,
                ),
            ).toStrictEqual(
                `${window.location.origin}/coinmarket-redirect#sell-offers/sol/normal/1/p-qc/CZ/EUR/0.001/bitcoin/creditCard/quoteId/normal/1/2/3/4`,
            );
        });
    });
});
