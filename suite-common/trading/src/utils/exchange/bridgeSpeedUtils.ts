import { type ExchangeTrade } from 'invity-api';

import { type TradingBridgeExchangeTrade, type TradingBridgeSpeed } from '../../types';

export const getTradeBridgeSpeed = (
    trade: ExchangeTrade | undefined,
): TradingBridgeSpeed | undefined => {
    const bridgeTrade: TradingBridgeExchangeTrade | undefined = trade;

    return bridgeTrade?.bridgeSpeed;
};

export const getTradeBridgeFastFeePercent = (
    trade: ExchangeTrade | undefined,
): string | undefined => {
    const bridgeTrade: TradingBridgeExchangeTrade | undefined = trade;

    return bridgeTrade?.bridgeFastFeePercent;
};

type WithTradeBridgeSpeedParams = {
    trade: ExchangeTrade;
    bridgeSpeed: TradingBridgeSpeed;
};

export const withTradeBridgeSpeed = ({
    trade,
    bridgeSpeed,
}: WithTradeBridgeSpeedParams): ExchangeTrade => {
    const bridgeTrade: TradingBridgeExchangeTrade = { ...trade, bridgeSpeed };

    return bridgeTrade;
};
