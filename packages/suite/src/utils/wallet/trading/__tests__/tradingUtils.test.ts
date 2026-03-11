import { buildTradingFiatOption } from '@suite-common/trading';

import { FIXTURE_ACCOUNT_OPTIONS } from 'src/utils/wallet/trading/__fixtures__/tradingUtils';
import {
    getCountryLabelParts,
    getTradeTypeByRoute,
    resolveAddressAndToken,
    tradingGetAccountLabel,
    tradingGetAmountLabels,
    tradingGetRoundedFiatAmount,
} from 'src/utils/wallet/trading/tradingUtils';

jest.mock('src/hooks/suite/useDefaultAccountLabel', () => ({
    ...jest.requireActual('src/hooks/suite/useDefaultAccountLabel'),
    useDefaultAccountLabel: jest.fn(),
}));

describe('trading utils', () => {
    it('buildFiatOption', () => {
        expect(buildTradingFiatOption('czk')).toStrictEqual({ value: 'czk', label: 'CZK' });
    });

    it('getCountryLabelParts', () => {
        expect(getCountryLabelParts('🇨🇿 Czech Republic')).toStrictEqual({
            flag: '🇨🇿',
            text: 'Czech Republic',
        });
        expect(getCountryLabelParts('aaa')).toStrictEqual({
            flag: '',
            text: 'aaa',
        });
    });

    it('tradingGetAmountLabels', () => {
        expect(tradingGetAmountLabels({ type: 'sell', amountInCrypto: true })).toEqual({
            inputLabel: 'TR_TRADING_YOU_PAY',
            offerLabel: 'TR_TRADING_YOU_GET',
            labelComparatorOffer: 'TR_TRADING_YOU_WILL_GET',
            sendLabel: 'TR_TRADING_YOU_GET',
            receiveLabel: 'TR_TRADING_YOU_PAY',
        });

        expect(tradingGetAmountLabels({ type: 'sell', amountInCrypto: false })).toEqual({
            inputLabel: 'TR_TRADING_YOU_GET',
            offerLabel: 'TR_TRADING_YOU_PAY',
            labelComparatorOffer: 'TR_TRADING_YOU_WILL_PAY',
            sendLabel: 'TR_TRADING_YOU_GET',
            receiveLabel: 'TR_TRADING_YOU_PAY',
        });

        expect(tradingGetAmountLabels({ type: 'buy', amountInCrypto: true })).toEqual({
            inputLabel: 'TR_TRADING_YOU_GET',
            offerLabel: 'TR_TRADING_YOU_PAY',
            labelComparatorOffer: 'TR_TRADING_YOU_WILL_PAY',
            sendLabel: 'TR_TRADING_YOU_PAY',
            receiveLabel: 'TR_TRADING_YOU_GET',
        });

        expect(tradingGetAmountLabels({ type: 'buy', amountInCrypto: false })).toEqual({
            inputLabel: 'TR_TRADING_YOU_PAY',
            offerLabel: 'TR_TRADING_YOU_GET',
            labelComparatorOffer: 'TR_TRADING_YOU_WILL_GET',
            sendLabel: 'TR_TRADING_YOU_PAY',
            receiveLabel: 'TR_TRADING_YOU_GET',
        });

        expect(tradingGetAmountLabels({ type: 'exchange', amountInCrypto: false })).toEqual({
            inputLabel: 'TR_TRADING_SWAP_AMOUNT',
            offerLabel: 'TR_TRADING_YOU_GET',
            labelComparatorOffer: 'TR_TRADING_YOU_WILL_GET',
            sendLabel: 'TR_TRADING_YOU_PAY',
            receiveLabel: 'TR_TRADING_YOU_GET',
        });
    });

    it('tradingGetRoundedFiatAmount', () => {
        expect(tradingGetRoundedFiatAmount('0.23923')).toBe('0.24');
        expect(tradingGetRoundedFiatAmount('0.24423')).toBe('0.24');
        expect(tradingGetRoundedFiatAmount('0.2')).toBe('0.20');
        expect(tradingGetRoundedFiatAmount(undefined)).toBe('');
        expect(tradingGetRoundedFiatAmount('293SAsdj2')).toBe(''); // NaN
    });

    it('tradingGetAccountLabel', () => {
        expect(tradingGetAccountLabel('BTC', true)).toBe('sat');
        expect(tradingGetAccountLabel('BTC', false)).toBe('BTC');
        expect(tradingGetAccountLabel('USDT', true)).toBe('USDT');
        expect(tradingGetAccountLabel('USDT', false)).toBe('USDT');
    });

    it('resolveAddressAndToken - testing correct returning value fot setting FormState to send currency', () => {
        FIXTURE_ACCOUNT_OPTIONS.forEach(({ option, result }) => {
            expect(resolveAddressAndToken(option.account, option.tokenContractAddress)).toEqual(
                result,
            );
        });
    });

    it('getTradeTypeByRoute - testing correct returning trade section according to route', () => {
        expect(getTradeTypeByRoute('wallet-trading-buy')).toEqual('buy');
        expect(getTradeTypeByRoute('wallet-trading-buy-detail')).toEqual('buy');
        expect(getTradeTypeByRoute('wallet-trading-buy-offers')).toEqual('buy');
        expect(getTradeTypeByRoute('wallet-trading-buy-confirm')).toEqual('buy');

        expect(getTradeTypeByRoute('wallet-trading-sell')).toEqual('sell');
        expect(getTradeTypeByRoute('wallet-trading-sell-detail')).toEqual('sell');
        expect(getTradeTypeByRoute('wallet-trading-sell-offers')).toEqual('sell');
        expect(getTradeTypeByRoute('wallet-trading-sell-confirm')).toEqual('sell');

        expect(getTradeTypeByRoute('wallet-trading-exchange')).toEqual('exchange');
        expect(getTradeTypeByRoute('wallet-trading-exchange-detail')).toEqual('exchange');
        expect(getTradeTypeByRoute('wallet-trading-exchange-offers')).toEqual('exchange');
        expect(getTradeTypeByRoute('wallet-trading-exchange-confirm')).toEqual('exchange');

        expect(getTradeTypeByRoute('wallet-index')).toEqual(undefined);
    });
});
