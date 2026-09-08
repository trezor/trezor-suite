import { type ExchangeTradeStatus } from 'invity-api';

import { isFinalStatus } from '@suite-common/trading';

import { type TradingDetailProgress } from 'src/views/wallet/trading/common/TradingDetail/utils';

export type ExchangeDetailStatusStep =
    'sending' | 'converting' | 'kyc' | 'success' | 'error' | undefined;

export type ExchangeDetailTerminalStep = Exclude<
    ExchangeDetailStatusStep,
    'sending' | 'converting' | undefined
>;

export const getExchangeDetailStatusStep = (
    tradeStatus: ExchangeTradeStatus,
): ExchangeDetailStatusStep => {
    switch (tradeStatus) {
        case 'CONVERTING':
            return 'converting';
        case 'KYC':
            return 'kyc';
        case 'ERROR':
            return 'error';
        case 'SUCCESS':
            return 'success';
        default: {
            if (!isFinalStatus('exchange', tradeStatus)) {
                return 'sending';
            }

            return undefined;
        }
    }
};

export const getExchangeDetailProgress = (
    tradeStatus: ExchangeTradeStatus,
    isDex?: boolean,
): TradingDetailProgress => {
    switch (tradeStatus) {
        case 'SUCCESS':
            return 'completed';
        case 'CONVERTING':
            return 'providerProcessing';
        default:
            return isDex ? 'providerProcessing' : 'customerAction';
    }
};
