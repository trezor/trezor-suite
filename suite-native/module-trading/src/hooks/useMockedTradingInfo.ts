import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { tradingActions } from '@suite-common/trading';

import mockedCoins from '../__fixtures__/coins.json';
import mockedPlatforms from '../__fixtures__/platforms.json';
import { TradingRootState } from '../tradingSlice';

export const useMockedTradingInfo = () => {
    const dispatch = useDispatch();

    const { platforms, coins } = useSelector(
        ({ wallet }: TradingRootState) => wallet.tradingNew.info,
    );

    useEffect(() => {
        if (!platforms || !coins) {
            dispatch(
                tradingActions.saveInfo({
                    platforms: mockedPlatforms,
                    coins: mockedCoins,
                }),
            );
        }
    }, [dispatch, platforms, coins]);
};
