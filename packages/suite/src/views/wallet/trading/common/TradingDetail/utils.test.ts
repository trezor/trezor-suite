import { type BuyProviderInfo, type SellProviderInfo } from 'invity-api';

import { type StepListItemState } from '@trezor/components';

import {
    type TradingDetailProgress,
    type TradingDetailStepPosition,
    getTradingDetailStepState,
    getTradingProviderName,
} from './utils';

describe('getTradingDetailStepState', () => {
    it.each<[TradingDetailProgress, TradingDetailStepPosition, StepListItemState]>([
        ['customerAction', 'customerAction', 'active'],
        ['customerAction', 'providerProcessing', 'pending'],
        ['providerProcessing', 'customerAction', 'done'],
        ['providerProcessing', 'providerProcessing', 'active'],
        ['completed', 'customerAction', 'done'],
        ['completed', 'providerProcessing', 'done'],
    ])('at %s the %s step is %s', (progress, stepPosition, expected) => {
        expect(getTradingDetailStepState(progress, stepPosition)).toBe(expected);
    });
});

describe('getTradingProviderName', () => {
    const buyProvider: BuyProviderInfo = {
        name: 'banxa',
        companyName: 'Banxa',
        brandName: 'Invity',
        logo: 'banxa-icon.jpg',
        isActive: true,
        tradedCoins: [],
        tradedFiatCurrencies: [],
        paymentMethods: [],
        supportedCountries: [],
        supportedSubdivisions: {},
    };

    const sellProvider: SellProviderInfo = {
        name: 'moonpay',
        companyName: 'MoonPay',
        logo: 'moonpay-icon.jpg',
        type: 'Fiat',
        isActive: true,
        tradedCoins: [],
        tradedFiatCurrencies: [],
        paymentMethods: [],
        supportedCountries: [],
        supportedSubdivisions: {},
    };

    it('prefers the brand name of a buy provider', () => {
        expect(getTradingProviderName(buyProvider)).toBe('Invity');
    });

    it('falls back to the company name of a buy provider without a brand name', () => {
        expect(getTradingProviderName({ ...buyProvider, brandName: undefined })).toBe('Banxa');
    });

    it('uses the company name of a non-buy provider', () => {
        expect(getTradingProviderName(sellProvider)).toBe('MoonPay');
    });

    it('is empty without a provider', () => {
        expect(getTradingProviderName()).toBe('');
    });
});
