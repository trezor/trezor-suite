import {
    isCoinmarketExchangeContext,
    isCoinmarketSellContext,
} from 'src/utils/wallet/coinmarket/coinmarketTypingUtils';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';

export const useCoinmarketDeviceDisconnected = () => {
    const context = useCoinmarketFormContext();
    const { device } = context;

    const isSellOrExchangeContext =
        isCoinmarketSellContext(context) || isCoinmarketExchangeContext(context);
    const isDeviceDisconnected = !device?.connected;

    const coinmarketDeviceDisconnected = isSellOrExchangeContext && isDeviceDisconnected;

    return { coinmarketDeviceDisconnected };
};
