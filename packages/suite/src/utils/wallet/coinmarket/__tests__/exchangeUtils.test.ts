import * as fixtures from '../__fixtures__/exchangeUtils';
import {
    getAmountLimits,
    getStatusMessage,
    isQuoteError,
    splitToFixedFloatQuotes,
} from '../exchangeUtils';

const {
    EXCHANGE_INFO,
    MIN_MAX_QUOTES_OK,
    MIN_MAX_QUOTES_LOW,
    MIN_MAX_QUOTES_CANNOT_TRADE,
} = fixtures;

describe('coinmarket/exchange utils', () => {
    it('getAmountLimits', () => {
        expect(getAmountLimits(MIN_MAX_QUOTES_OK)).toBe(undefined);
        expect(getAmountLimits(MIN_MAX_QUOTES_LOW)).toStrictEqual({
            currency: 'LTC',
            max: undefined,
            min: 0.35121471511608626,
        });
        expect(getAmountLimits(MIN_MAX_QUOTES_CANNOT_TRADE)).toBe(undefined);
    });

    it('isQuoteError', () => {
        expect(isQuoteError(MIN_MAX_QUOTES_OK[0])).toBe(false);
        expect(isQuoteError(MIN_MAX_QUOTES_LOW[0])).toBe(true);
        expect(isQuoteError(MIN_MAX_QUOTES_CANNOT_TRADE[0])).toBe(true);
    });

    it('splitQuotes', () => {
        expect(splitToFixedFloatQuotes(MIN_MAX_QUOTES_OK, EXCHANGE_INFO)).toStrictEqual([
            [
                {
                    send: 'LTC',
                    sendStringAmount: '12',
                    receive: 'BTC',
                    receiveStringAmount: '0.06047229',
                    rate: 0.0050393575,
                    min: 1.68,
                    max: 130,
                    fee: 'INCLUDED',
                    exchange: 'foxexchangefr',
                    quoteToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
                },
                {
                    send: 'LTC',
                    sendStringAmount: '12',
                    receive: 'BTC',
                    receiveStringAmount: '0.06036741979259172204',
                    rate: 0.005030618316049311,
                    min: 0.35206704205749473,
                    max: 195.59280114305264,
                    fee: 'INCLUDED',
                    rateIdentificator: '6ad45ee9-a8fa-4d25-a3c8-05361176b49d',
                    exchange: 'changeherofr',
                },
                {
                    send: 'LTC',
                    sendStringAmount: '12',
                    receive: 'BTC',
                    receiveStringAmount: '0.05984359',
                    rate: 0.004986965833333333,
                    min: 0.8295,
                    max: 719.15,
                    fee: 'INCLUDED',
                    offerReferenceId: 'db551578-915a-47c9-9197-a656e9372f2c',
                    exchange: 'coinswitchfr',
                },
                {
                    send: 'LTC',
                    sendStringAmount: '12',
                    receive: 'BTC',
                    receiveStringAmount: '0.0595996968',
                    rate: 0.0049666414,
                    min: 0.948,
                    max: 757,
                    fee: 'INCLUDED',
                    rateIdentificator:
                        'e98f80e3e29dd57c0356141836c113f1c19ecadf66ee77fde5835796499cfe065e73',
                    exchange: 'changellyfr',
                },
                {
                    send: 'LTC',
                    sendStringAmount: '12',
                    receive: 'BTC',
                    receiveStringAmount: '0.0595048',
                    rate: 0.004958733333333333,
                    min: 0.70367472,
                    max: 293.1036283,
                    fee: 'INCLUDED',
                    exchange: 'changenowfr',
                },
            ],
            [
                {
                    send: 'LTC',
                    sendStringAmount: '12',
                    receive: 'BTC',
                    receiveStringAmount: '0.0609979',
                    rate: 0.005083158333333333,
                    min: 0.5688,
                    max: 'NONE',
                    fee: 'UNKNOWN',
                    exchange: 'changelly',
                },
                {
                    send: 'LTC',
                    sendStringAmount: '12',
                    receive: 'BTC',
                    receiveStringAmount: '0.0605096167302',
                    rate: 0.00504246806085,
                    min: 1.68,
                    max: 130,
                    fee: 'UNKNOWN',
                    exchange: 'foxexchange',
                    quoteToken: '',
                },
                {
                    send: 'LTC',
                    sendStringAmount: '12',
                    receive: 'BTC',
                    receiveStringAmount: '0.060238681',
                    rate: 0.005019890083333333,
                    min: 0.35121471511608626,
                    max: 'NONE',
                    fee: 'UNKNOWN',
                    exchange: 'changehero',
                },
                {
                    send: 'LTC',
                    sendStringAmount: '12',
                    receive: 'BTC',
                    receiveStringAmount: '0.059907672',
                    rate: 0.004992305999999999,
                    min: 0.5245852799999999,
                    max: 'NONE',
                    fee: 'UNKNOWN',
                    exchange: 'changenow',
                },
                {
                    send: 'LTC',
                    sendStringAmount: '12',
                    receive: 'BTC',
                    receiveStringAmount: '0.05980199613749862984',
                    rate: 0.004983499678124886,
                    min: 0.85,
                    max: 80,
                    fee: 'UNKNOWN',
                    exchange: 'coinswitch',
                },
            ],
        ]);
        expect(splitToFixedFloatQuotes(MIN_MAX_QUOTES_CANNOT_TRADE, EXCHANGE_INFO)).toStrictEqual([
            [
                { error: 'Cannot trade pair LTC-DATA.', exchange: 'changeherofr' },
                { error: 'Cannot trade pair LTC-DATA.', exchange: 'changellyfr' },
                { error: 'Cannot trade pair LTC-DATA.', exchange: 'changenowfr' },
                { error: 'Cannot trade pair LTC-DATA.', exchange: 'coinswitchfr' },
                { error: 'Cannot trade pair LTC-DATA.', exchange: 'foxexchangefr' },
            ],
            [
                { error: 'Cannot trade pair LTC-DATA.', exchange: 'changehero' },
                { error: 'Cannot trade pair LTC-DATA.', exchange: 'changelly' },
                { error: 'Cannot trade pair LTC-DATA.', exchange: 'changenow' },
                { error: 'Cannot trade pair LTC-DATA.', exchange: 'coinswitch' },
                { error: 'Cannot trade pair LTC-DATA.', exchange: 'foxexchange' },
            ],
        ]);
    });
    it('getStatusMessage', () => {
        expect(getStatusMessage('CONVERTING')).toBe('TR_EXCHANGE_STATUS_CONVERTING');
        expect(getStatusMessage('CONFIRMING')).toBe('TR_EXCHANGE_STATUS_CONFIRMING');
        expect(getStatusMessage('KYC')).toBe('TR_EXCHANGE_STATUS_KYC');
        expect(getStatusMessage('ERROR')).toBe('TR_EXCHANGE_STATUS_ERROR');
        expect(getStatusMessage('SUCCESS')).toBe('TR_EXCHANGE_STATUS_SUCCESS');
    });
});
