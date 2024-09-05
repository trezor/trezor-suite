import { CryptoId } from 'invity-api';
import * as fixtures from '../__fixtures__/exchangeUtils';
import {
    coinmarketGetExchangeReceiveCryptoId,
    getAmountLimits,
    getStatusMessage,
    getSuccessQuotesOrdered,
    isQuoteError,
} from '../exchangeUtils';

const { MIN_MAX_QUOTES_OK, MIN_MAX_QUOTES_LOW, MIN_MAX_QUOTES_CANNOT_TRADE } = fixtures;

describe('coinmarket/exchange utils', () => {
    it('getAmountLimits', () => {
        expect(getAmountLimits(MIN_MAX_QUOTES_OK)).toBe(undefined);
        expect(getAmountLimits(MIN_MAX_QUOTES_LOW)).toStrictEqual({
            currency: 'LTC',
            maxCrypto: undefined,
            minCrypto: 0.35121471511608626,
        });
        expect(getAmountLimits(MIN_MAX_QUOTES_CANNOT_TRADE)).toBe(undefined);
    });

    it('isQuoteError', () => {
        expect(isQuoteError(MIN_MAX_QUOTES_OK[0])).toBe(false);
        expect(isQuoteError(MIN_MAX_QUOTES_LOW[0])).toBe(true);
        expect(isQuoteError(MIN_MAX_QUOTES_CANNOT_TRADE[0])).toBe(true);
    });

    it('getSuccessQuotesOrdered', () => {
        expect(
            getSuccessQuotesOrdered([
                ...MIN_MAX_QUOTES_OK,
                ...MIN_MAX_QUOTES_LOW,
                ...MIN_MAX_QUOTES_CANNOT_TRADE,
            ]),
        ).toStrictEqual([
            {
                exchange: 'changelly',
                fee: 'UNKNOWN',
                max: 'NONE',
                min: 0.5688,
                rate: 0.005083158333333333,
                receive: 'BTC',
                receiveStringAmount: '0.0609979',
                send: 'LTC',
                sendStringAmount: '12',
            },
            {
                exchange: 'foxexchange',
                fee: 'UNKNOWN',
                max: 130,
                min: 1.68,
                quoteToken: '',
                rate: 0.00504246806085,
                receive: 'BTC',
                receiveStringAmount: '0.0605096167302',
                send: 'LTC',
                sendStringAmount: '12',
            },
            {
                exchange: 'foxexchangefr',
                fee: 'INCLUDED',
                max: 130,
                min: 1.68,
                quoteToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
                rate: 0.0050393575,
                receive: 'BTC',
                receiveStringAmount: '0.06047229',
                send: 'LTC',
                sendStringAmount: '12',
            },
            {
                exchange: 'changeherofr',
                fee: 'INCLUDED',
                max: 195.59280114305264,
                min: 0.35206704205749473,
                rate: 0.005030618316049311,
                rateIdentificator: '6ad45ee9-a8fa-4d25-a3c8-05361176b49d',
                receive: 'BTC',
                receiveStringAmount: '0.06036741979259172204',
                send: 'LTC',
                sendStringAmount: '12',
            },
            {
                exchange: 'changehero',
                fee: 'UNKNOWN',
                max: 'NONE',
                min: 0.35121471511608626,
                rate: 0.005019890083333333,
                receive: 'BTC',
                receiveStringAmount: '0.060238681',
                send: 'LTC',
                sendStringAmount: '12',
            },
            {
                exchange: 'changenow',
                fee: 'UNKNOWN',
                max: 'NONE',
                min: 0.5245852799999999,
                rate: 0.004992305999999999,
                receive: 'BTC',
                receiveStringAmount: '0.059907672',
                send: 'LTC',
                sendStringAmount: '12',
            },
            {
                exchange: 'coinswitchfr',
                fee: 'INCLUDED',
                max: 719.15,
                min: 0.8295,
                offerReferenceId: 'db551578-915a-47c9-9197-a656e9372f2c',
                rate: 0.004986965833333333,
                receive: 'BTC',
                receiveStringAmount: '0.05984359',
                send: 'LTC',
                sendStringAmount: '12',
            },
            {
                exchange: 'coinswitch',
                fee: 'UNKNOWN',
                max: 80,
                min: 0.85,
                rate: 0.004983499678124886,
                receive: 'BTC',
                receiveStringAmount: '0.05980199613749862984',
                send: 'LTC',
                sendStringAmount: '12',
            },
            {
                exchange: 'changellyfr',
                fee: 'INCLUDED',
                max: 757,
                min: 0.948,
                rate: 0.0049666414,
                rateIdentificator:
                    'e98f80e3e29dd57c0356141836c113f1c19ecadf66ee77fde5835796499cfe065e73',
                receive: 'BTC',
                receiveStringAmount: '0.0595996968',
                send: 'LTC',
                sendStringAmount: '12',
            },
            {
                exchange: 'changenowfr',
                fee: 'INCLUDED',
                max: 293.1036283,
                min: 0.70367472,
                rate: 0.004958733333333333,
                receive: 'BTC',
                receiveStringAmount: '0.0595048',
                send: 'LTC',
                sendStringAmount: '12',
            },
            {
                approvalGasEstimate: 57000,
                exchange: '1inch',
                fee: 'UNKNOWN',
                isDex: true,
                max: 'NONE',
                min: 0,
                rate: 33376.2444612639,
                receive: 'CRO@ETH',
                receiveStringAmount: '1116.96945045',
                send: 'ETH',
                sendStringAmount: '0.033466001597224105',
                swapGasEstimate: 189386,
                swapSlippage: '1',
            },
        ]);
    });
    it('getStatusMessage', () => {
        expect(getStatusMessage('CONVERTING')).toBe('TR_EXCHANGE_STATUS_CONVERTING');
        expect(getStatusMessage('CONFIRMING')).toBe('TR_EXCHANGE_STATUS_CONFIRMING');
        expect(getStatusMessage('KYC')).toBe('TR_EXCHANGE_STATUS_KYC');
        expect(getStatusMessage('ERROR')).toBe('TR_EXCHANGE_STATUS_ERROR');
        expect(getStatusMessage('SUCCESS')).toBe('TR_EXCHANGE_STATUS_SUCCESS');
    });

    it('coinmarketGetExchangeReceiveCryptoId', () => {
        // default cryptoId
        expect(coinmarketGetExchangeReceiveCryptoId('bitcoin' as CryptoId)).toBe('ethereum');
        expect(coinmarketGetExchangeReceiveCryptoId('litecoin' as CryptoId)).toBe('bitcoin');
        expect(
            coinmarketGetExchangeReceiveCryptoId(
                'ethereum--0x0000000000085d4780b73119b644ae5ecd22b376' as CryptoId,
            ),
        ).toBe('bitcoin');

        // already selected
        expect(
            coinmarketGetExchangeReceiveCryptoId('bitcoin' as CryptoId, 'bitcoin' as CryptoId),
        ).toBe('ethereum');
        expect(
            coinmarketGetExchangeReceiveCryptoId(
                'bitcoin' as CryptoId,
                'ethereum--0x0000000000085d4780b73119b644ae5ecd22b376' as CryptoId,
            ),
        ).toBe('ethereum--0x0000000000085d4780b73119b644ae5ecd22b376');
    });
});
