import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import type { CryptoId } from 'invity-api';

import {
    type TradingRootState,
    selectTradingCoinInfoByCryptoId,
    selectTradingCoins,
} from '@suite-common/trading';
import type { TradeableAsset } from '@suite-native/trading-types';

type FormSetValue = (key: 'asset', value: TradeableAsset | undefined) => void;

export const useTradeableAssetValidityEffect = (
    setValue: FormSetValue,
    cryptoId: CryptoId | undefined,
) => {
    const coins = useSelector(selectTradingCoins);
    const coinInfo = useSelector((state: TradingRootState) =>
        selectTradingCoinInfoByCryptoId(state, cryptoId),
    );

    useEffect(() => {
        if (!cryptoId || !coins || Object.keys(coins).length === 0) {
            return;
        }

        if (!coinInfo) {
            setValue('asset', undefined);
        }
    }, [cryptoId, coins, coinInfo, setValue]);
};
