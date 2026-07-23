import { createContext, useContext, useEffect } from 'react';

import { useDevice } from '@suite/device';
import {
    type TradingType,
    type TradingUseDetailOutputProps,
    type TradingUseDetailPropsWithoutAccount,
    useTradingDetail as useTradingDetailCommon,
} from '@suite-common/trading';
import { throwError } from '@trezor/utils';

import { setConnectionModal } from 'src/actions/device/deviceSlice';
import { useDispatch } from 'src/hooks/suite';
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
    const { device } = useDevice();
    const dispatch = useDispatch();

    const result = useTradingDetailCommon<T>({ tradeType });

    useEffect(() => {
        dispatch(setConnectionModal(!device?.connected));
    }, [device?.connected, dispatch]);

    // Setup server environment from suite settings
    useServerEnvironment();

    // Watch for trade updates
    useTradingWatchTrade({ account, trade: result.trade });

    return { ...result, account };
};

export const TradingDetailContext = createContext<TradingDetailContextValues<any> | null>(null);
TradingDetailContext.displayName = 'TradingDetailContext';

export const useTradingDetailContext = <T extends TradingType>() =>
    useContext<TradingDetailContextValues<T> | null>(TradingDetailContext) ??
    throwError('TradingDetailContext used without Context');
