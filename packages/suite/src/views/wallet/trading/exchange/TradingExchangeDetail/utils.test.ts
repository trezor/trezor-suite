import { type ExchangeTradeStatus } from 'invity-api';

import { type TradingDetailProgress } from 'src/views/wallet/trading/common/TradingDetail/utils';

import {
    type ExchangeDetailStatusStep,
    getExchangeDetailProgress,
    getExchangeDetailStatusStep,
} from './utils';

describe('getExchangeDetailStatusStep', () => {
    it.each<[ExchangeTradeStatus, ExchangeDetailStatusStep]>([
        ['LOADING', 'sending'],
        ['CONFIRM', 'sending'],
        ['SENDING', 'sending'],
        ['CONFIRMING', 'sending'],
        ['APPROVAL_REQ', 'sending'],
        ['APPROVAL_PENDING', 'sending'],
        ['SIGN_DATA', 'sending'],
        ['CONVERTING', 'converting'],
        ['KYC', 'kyc'],
        ['SUCCESS', 'success'],
        ['ERROR', 'error'],
    ])('maps %s to the %s step', (tradeStatus, expected) => {
        expect(getExchangeDetailStatusStep(tradeStatus)).toBe(expected);
    });
});

describe('getExchangeDetailProgress', () => {
    it.each<[ExchangeTradeStatus, TradingDetailProgress]>([
        ['LOADING', 'customerAction'],
        ['CONFIRM', 'customerAction'],
        ['SENDING', 'customerAction'],
        ['CONFIRMING', 'customerAction'],
        ['APPROVAL_REQ', 'customerAction'],
        ['APPROVAL_PENDING', 'customerAction'],
        ['SIGN_DATA', 'customerAction'],
        ['CONVERTING', 'providerProcessing'],
        ['KYC', 'customerAction'],
        ['SUCCESS', 'completed'],
        ['ERROR', 'customerAction'],
    ])('maps %s to %s', (tradeStatus, expected) => {
        expect(getExchangeDetailProgress(tradeStatus)).toBe(expected);
    });

    it.each<[ExchangeTradeStatus, TradingDetailProgress]>([
        ['LOADING', 'providerProcessing'],
        ['CONFIRM', 'providerProcessing'],
        ['SENDING', 'providerProcessing'],
        ['CONFIRMING', 'providerProcessing'],
        ['APPROVAL_REQ', 'providerProcessing'],
        ['APPROVAL_PENDING', 'providerProcessing'],
        ['SIGN_DATA', 'providerProcessing'],
        ['CONVERTING', 'providerProcessing'],
        ['KYC', 'providerProcessing'],
        ['SUCCESS', 'completed'],
        ['ERROR', 'providerProcessing'],
    ])('maps %s to %s for a DEX trade', (tradeStatus, expected) => {
        expect(getExchangeDetailProgress(tradeStatus, true)).toBe(expected);
    });
});
