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

type UseAssetPreselectionEffectParams = {
    preselection: AssetPreselection | undefined;
    selectedAsset: TradeableAsset | undefined;
    changeAsset: ChangeTradeableAsset;
};

const useAssetPreselectionEffect = ({
    preselection,
    selectedAsset,
    changeAsset,
}: UseAssetPreselectionEffectParams) => {
    const applyPreselection = useEffectEvent(() => {
        if (selectedAsset || !preselection) {
            return;
        }

        changeAsset(preselection.asset, preselection.account, { shouldReportAnalytics: false });
    });

    useEffect(() => {
        applyPreselection();
    }, []);
};

type UseDefaultSendAssetPreselectionParams = {
    tradingType: Exclude<TradingType, 'buy'>;
    selectedAsset: TradeableAsset | undefined;
    changeAsset: ChangeTradeableAsset;
};

export const useDefaultSendAssetPreselection = ({
    tradingType,
    selectedAsset,
    changeAsset,
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

    useAssetPreselectionEffect({ preselection, selectedAsset, changeAsset });
};

type UseDefaultReceiveAssetPreselectionParams = {
    tradingType: Exclude<TradingType, 'sell'>;
    tradeableAssets: TradeableAsset[];
    selectedAsset: TradeableAsset | undefined;
    changeAsset: ChangeTradeableAsset;
};

export const useDefaultReceiveAssetPreselection = ({
    tradingType,
    tradeableAssets,
    selectedAsset,
    changeAsset,
}: UseDefaultReceiveAssetPreselectionParams) => {
    const asset = findTradeableAssetByCryptoIds(
        tradeableAssets,
        TRADING_FORM_DEFAULT_ASSETS[tradingType].receive,
    );

    useAssetPreselectionEffect({
        preselection: asset ? { asset } : undefined,
        selectedAsset,
        changeAsset,
    });
};
