import {
    isTradingExchangeContext,
    isTradingSellContext,
} from 'src/utils/wallet/trading/tradingTypingUtils';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';

export const useTradingDeviceDisconnected = () => {
    const context = useTradingFormContext();
    const { device } = context;

    const isSellOrExchangeContext =
        isTradingSellContext(context) || isTradingExchangeContext(context);
    const isDeviceDisconnected = !device?.connected;

    const tradingDeviceDisconnected = isSellOrExchangeContext && isDeviceDisconnected;

    return { tradingDeviceDisconnected };
};
