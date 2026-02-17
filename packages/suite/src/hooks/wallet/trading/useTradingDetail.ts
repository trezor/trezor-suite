import { createContext, useContext } from 'react';

import {
    type TradingType,
    type TradingUseDetailOutputProps,
    type TradingUseDetailPropsWithoutAccount,
    useTradingDetail as useTradingDetailCommon,
} from '@suite-common/trading';

import { useServerEnvironment } from 'src/hooks/wallet/trading/useServerEnviroment';
import { useTradingWatchTrade } from 'src/hooks/wallet/trading/useTradingWatchTrade';
import type { TradingDetailContextValues } from 'src/types/trading/tradingDetail';

import { useTradingFormAccount } from './form/useTradingFormAccount';

/**
 * Suite-specific wrapper around the common useTradingDetail hook
 * Adds platform-specific functionality like server environment setup and trade watching
 */
export const useTradingDetail = <T extends TradingType>(
    props: TradingUseDetailPropsWithoutAccount & { tradeType: T },
): TradingUseDetailOutputProps<T> => {
    const { tradeType } = props;
    const { account } = useTradingFormAccount(tradeType);

    const result = useTradingDetailCommon<T>({ tradeType });

    // Setup server environment from suite settings
    useServerEnvironment();

    // Watch for trade updates
    useTradingWatchTrade({ account, trade: result.trade });

    return { ...result, account };
};

export const TradingDetailContext = createContext<TradingDetailContextValues<any> | null>(null);
TradingDetailContext.displayName = 'TradingDetailContext';

export const useTradingDetailContext = <T extends TradingType>() => {
    const context = useContext<TradingDetailContextValues<T> | null>(TradingDetailContext);
    if (context === null) throw Error('TradingDetailContext used without Context');

    return context;
};
