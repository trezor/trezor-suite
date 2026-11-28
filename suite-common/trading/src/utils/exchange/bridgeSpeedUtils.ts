import { type ExchangeTrade, type ExchangeTradeQuoteRequest } from 'invity-api';

import {
    type TradingBridgeSpeed,
    type TradingBridgeSpeedFields,
    type TradingBridgeSpeedOption,
} from '../../types';

export const getTradeBridgeSpeed = (
    trade: ExchangeTrade | undefined,
): TradingBridgeSpeed | undefined => {
    const bridgeTrade: (ExchangeTrade & TradingBridgeSpeedFields) | undefined = trade;

    return bridgeTrade?.bridgeSpeed;
};

export const getTradeBridgeSpeedOptions = (
    trade: ExchangeTrade | undefined,
): TradingBridgeSpeedOption[] => {
    const bridgeTrade: (ExchangeTrade & TradingBridgeSpeedFields) | undefined = trade;

    return bridgeTrade?.bridgeSpeeds ?? [];
};

type WithQuotesRequestBridgeSpeedParams = {
    request: ExchangeTradeQuoteRequest;
    bridgeSpeed: TradingBridgeSpeed;
};

export const withQuotesRequestBridgeSpeed = ({
    request,
    bridgeSpeed,
}: WithQuotesRequestBridgeSpeedParams): ExchangeTradeQuoteRequest => {
    const bridgeRequest: ExchangeTradeQuoteRequest & TradingBridgeSpeedFields = {
        ...request,
        bridgeSpeed,
    };

    return bridgeRequest;
};
