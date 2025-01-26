import {
    getStatusMessage,
    formatIban,
    getAmountLimits,
    createQuoteLink,
} from 'src/utils/wallet/coinmarket/sellUtils';
import { Account } from 'src/types/wallet';
import { ComposedTransactionInfo } from 'src/reducers/wallet/coinmarketReducer';
import * as fixtures from 'src/utils/wallet/coinmarket/__fixtures__/sellUtils';
import { useCoinmarketInfo } from 'src/hooks/wallet/coinmarket/useCoinmarketInfo';

const {
    QUOTE_REQUEST_FIAT,
    QUOTE_REQUEST_CRYPTO,
    MIN_MAX_QUOTES_OK,
    MIN_MAX_QUOTES_HIGH,
    MIN_MAX_QUOTES_LOW,
} = fixtures;

jest.mock('src/hooks/wallet/coinmarket/useCoinmarketInfo', () => ({
    ...jest.requireActual('src/hooks/wallet/coinmarket/useCoinmarketInfo'),
    useCoinmarketInfo: jest.fn(),
}));

describe('coinmarket/sell utils', () => {
    const cryptoIdToCoinSymbol = (useCoinmarketInfo as jest.Mock).mockImplementation(() => 'BTC');

    it('getAmountLimits', () => {
        expect(
            getAmountLimits({
                request: QUOTE_REQUEST_FIAT,
                quotes: MIN_MAX_QUOTES_OK,
                currency: cryptoIdToCoinSymbol().toLowerCase(),
            }),
        ).toBe(undefined);
        expect(
            getAmountLimits({
                request: QUOTE_REQUEST_CRYPTO,
                quotes: MIN_MAX_QUOTES_OK,
                currency: cryptoIdToCoinSymbol().toLowerCase(),
            }),
        ).toBe(undefined);

        expect(
            getAmountLimits({
                request: QUOTE_REQUEST_FIAT,
                quotes: MIN_MAX_QUOTES_LOW,
                currency: cryptoIdToCoinSymbol().toLowerCase(),
            }),
        ).toStrictEqual({
            currency: 'EUR',
            minFiat: '20',
        });
        expect(
            getAmountLimits({
                request: QUOTE_REQUEST_CRYPTO,
                quotes: MIN_MAX_QUOTES_LOW,
                currency: cryptoIdToCoinSymbol().toLowerCase(),
            }),
        ).toStrictEqual({
            currency: 'btc',
            minCrypto: '0.002',
        });

        expect(
            getAmountLimits({
                request: QUOTE_REQUEST_FIAT,
                quotes: MIN_MAX_QUOTES_HIGH,
                currency: cryptoIdToCoinSymbol().toLowerCase(),
            }),
        ).toStrictEqual({
            currency: 'EUR',
            maxFiat: '17045',
        });
        expect(
            getAmountLimits({
                request: QUOTE_REQUEST_CRYPTO,
                quotes: MIN_MAX_QUOTES_HIGH,
                currency: cryptoIdToCoinSymbol().toLowerCase(),
            }),
        ).toStrictEqual({
            currency: 'btc',
            maxCrypto: '1.67212968',
        });
    });

    it('createQuoteLink', async () => {
        const accountMock = {
            index: 1,
            accountType: 'normal',
            symbol: 'btc',
        } as Account;
        const composedInfoMock = {
            selectedFee: 'custom',
            composed: {
                feePerByte: '1',
                feeLimit: '2',
            },
        } as ComposedTransactionInfo;
        expect(
            await createQuoteLink(QUOTE_REQUEST_FIAT, accountMock, composedInfoMock),
        ).toStrictEqual(
            `${window.location.origin}/coinmarket-redirect#sell-offers/btc/normal/1/qf/CZ/EUR/10/bitcoin/custom/1/2`,
        );
        expect(
            await createQuoteLink(QUOTE_REQUEST_CRYPTO, accountMock, composedInfoMock),
        ).toStrictEqual(
            `${window.location.origin}/coinmarket-redirect#sell-offers/btc/normal/1/qc/CZ/EUR/0.001/bitcoin/custom/1/2`,
        );
        expect(
            await createQuoteLink(
                QUOTE_REQUEST_CRYPTO,
                accountMock,
                composedInfoMock,
                '42134432141234',
            ),
        ).toStrictEqual(
            `${window.location.origin}/coinmarket-redirect#sell-offers/btc/normal/1/p-qc/CZ/EUR/0.001/bitcoin/42134432141234/custom/1/2`,
        );
    });

    it('formatIban', () => {
        expect(formatIban('SE35 5000 0000 0549 1000 0003')).toEqual(
            'SE35 5000 0000 0549 1000 0003',
        );
        expect(formatIban('CH9300762011623852957')).toEqual('CH93 0076 2011 6238 5295 7');
    });

    it('getStatusMessage', () => {
        expect(getStatusMessage('PENDING')).toBe('TR_SELL_STATUS_PENDING');
        expect(getStatusMessage('SUBMITTED')).toBe('TR_SELL_STATUS_PENDING');
        expect(getStatusMessage('ERROR')).toBe('TR_SELL_STATUS_ERROR');
        expect(getStatusMessage('BLOCKED')).toBe('TR_SELL_STATUS_ERROR');
        expect(getStatusMessage('CANCELLED')).toBe('TR_SELL_STATUS_ERROR');
        expect(getStatusMessage('REFUNDED')).toBe('TR_SELL_STATUS_ERROR');
        expect(getStatusMessage('SUCCESS')).toBe('TR_SELL_STATUS_SUCCESS');
    });
});
