import { useEffect, useEffectEvent } from 'react';
import { useSelector } from 'react-redux';

import {
    type TradingRootState,
    type TradingType,
    selectTradingCoinInfoByCryptoId,
} from '@suite-common/trading';
import { type Account } from '@suite-common/wallet-types';
import { coinInfoToTradeableAsset } from '@suite-native/trading-atoms';
import { type TradeableAsset } from '@suite-native/trading-types';

import { type ChangeTradeableAsset } from './useTradeableAssetChange';
import { TRADING_FORM_DEFAULT_ASSETS } from '../../../constants';
import {
    findOwnedAssetByCryptoIds,
    findTradeableAssetByCryptoIds,
} from '../../../utils/general/defaultAssetUtils';
import { useTradingMyAssets } from '../useTradingMyAssets';

type AssetPreselection = {
    asset: TradeableAsset;
    account?: Account;
};

type UseAssetPreselectionParams = {
    preselection: AssetPreselection | undefined;
    selectedAsset: TradeableAsset | undefined;
    changeAsset: ChangeTradeableAsset;
    clearAsset: () => void;
};

const useAssetPreselection = ({
    preselection,
    selectedAsset,
    changeAsset,
    clearAsset,
}: UseAssetPreselectionParams) => {
    const applyPreselection = useEffectEvent(() => {
        if (selectedAsset || !preselection) {
            return;
        }

        changeAsset(preselection.asset, preselection.account, { shouldReportAnalytics: false });
    });

    useEffect(() => {
        applyPreselection();
    }, []);

    const applyDefaultAsset = () => {
        if (!preselection) {
            clearAsset();

            return;
        }

        changeAsset(preselection.asset, preselection.account, { shouldReportAnalytics: false });
    };

    return applyDefaultAsset;
};

type UseDefaultSendAssetPreselectionParams = {
    tradingType: Exclude<TradingType, 'buy'>;
    selectedAsset: TradeableAsset | undefined;
    changeAsset: ChangeTradeableAsset;
    clearAsset: () => void;
};

export const useDefaultSendAssetPreselection = ({
    tradingType,
    selectedAsset,
    changeAsset,
    clearAsset,
}: UseDefaultSendAssetPreselectionParams) => {
    const myAssets = useTradingMyAssets(tradingType);

    const ownedAsset = findOwnedAssetByCryptoIds(
        myAssets,
        TRADING_FORM_DEFAULT_ASSETS[tradingType].send,
    );
    const coinInfo = useSelector((state: TradingRootState) =>
        selectTradingCoinInfoByCryptoId(state, ownedAsset?.cryptoId),
    );

    const preselection =
        ownedAsset && coinInfo
            ? {
                  asset: coinInfoToTradeableAsset(ownedAsset.cryptoId, coinInfo),
                  account: ownedAsset.account,
              }
            : undefined;

    return useAssetPreselection({ preselection, selectedAsset, changeAsset, clearAsset });
};

type UseDefaultReceiveAssetPreselectionParams = {
    tradingType: Exclude<TradingType, 'sell'>;
    tradeableAssets: TradeableAsset[];
    selectedAsset: TradeableAsset | undefined;
    changeAsset: ChangeTradeableAsset;
    clearAsset: () => void;
};

export const useDefaultReceiveAssetPreselection = ({
    tradingType,
    tradeableAssets,
    selectedAsset,
    changeAsset,
    clearAsset,
}: UseDefaultReceiveAssetPreselectionParams) => {
    const asset = findTradeableAssetByCryptoIds(
        tradeableAssets,
        TRADING_FORM_DEFAULT_ASSETS[tradingType].receive,
    );

    return useAssetPreselection({
        preselection: asset ? { asset } : undefined,
        selectedAsset,
        changeAsset,
        clearAsset,
    });
};
