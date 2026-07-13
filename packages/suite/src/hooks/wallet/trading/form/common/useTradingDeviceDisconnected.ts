import { useDevice } from '@suite/device';

import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import {
    isTradingExchangeContext,
    isTradingSellContext,
} from 'src/utils/wallet/trading/tradingTypingUtils';

export const useTradingDeviceDisconnected = () => {
    const context = useTradingFormContext();
    const { device } = useDevice();

    const isSellOrExchangeContext =
        isTradingSellContext(context) || isTradingExchangeContext(context);
    const isDeviceDisconnected = !device?.connected;

    const tradingDeviceDisconnected = isSellOrExchangeContext && isDeviceDisconnected;

    return { tradingDeviceDisconnected };
};
