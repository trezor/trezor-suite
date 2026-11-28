import { useEffect } from 'react';

import { type CryptoId } from 'invity-api';

import { selectIsRegionRestricted } from '@suite/regions';
import {
    selectWalletAssetContractAddress,
    selectWalletAssetNetworkSymbol,
} from '@suite-common/assets';
import {
    type TradingPrefilledFromAccount,
    getCryptoId,
    selectTradingCoinInfoByCryptoId,
    tradingThunks,
} from '@suite-common/trading';
import { type AccountKey } from '@suite-common/wallet-types';
import { Row } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { useSelector } from '#src/hooks/suite/useSelector';
import { AssetDetailMenu } from '#src/views/home/AssetDetail/AssetDetailMenu/AssetDetailMenu';
import { selectRoutedAssetKey } from '#src/views/home/AssetDetail/selectRoutedAssetKey';

import { AssetSendReceive } from './GlobalSendReceive/AssetSendReceive';
import { TradeActions } from './TradeActions';
import { selectRoutedAssetTradeAccountKeys } from './selectRoutedAssetTradeAccountKeys';

const getTradePrefill = (
    cryptoId: CryptoId | undefined,
    accountKey: AccountKey | undefined,
): TradingPrefilledFromAccount | undefined =>
    accountKey === undefined ? undefined : { cryptoId, key: accountKey };

export const AssetDetailActions = () => {
    const { dispatch } = useServices(injectDispatch);
    const assetKey = useSelector(selectRoutedAssetKey);
    const networkSymbol = useSelector(state => selectWalletAssetNetworkSymbol(state, assetKey));
    const contractAddress = useSelector(state => selectWalletAssetContractAddress(state, assetKey));
    const tradeAccountKeys = useSelector(selectRoutedAssetTradeAccountKeys);
    const cryptoId =
        networkSymbol === undefined ? undefined : getCryptoId(networkSymbol, contractAddress);
    const services = useSelector(
        state => selectTradingCoinInfoByCryptoId(state, cryptoId)?.services,
    );
    const isRegionRestricted = useSelector(selectIsRegionRestricted);

    useEffect(() => {
        if (isRegionRestricted) return;

        // The trade buttons read only the coin info.
        const request = dispatch(
            tradingThunks.loadInitialDataThunk({ activeSection: 'buy', catalogs: ['info'] }),
        );

        return () => {
            request.abort();
        };
    }, [dispatch, isRegionRestricted]);

    if (assetKey === undefined || networkSymbol === undefined) return null;

    const buyPrefill = getTradePrefill(cryptoId, tradeAccountKeys.buy);
    const sellPrefill = getTradePrefill(cryptoId, tradeAccountKeys.sell);

    return (
        <Row gap={12}>
            <AssetDetailMenu assetKey={assetKey} />
            <TradeActions
                source={{ from: 'asset/header', networkSymbol, contractAddress }}
                prefill={{ buy: buyPrefill, sell: sellPrefill }}
                canBuy={!!services?.buy && buyPrefill !== undefined}
                canSell={!!services?.sell && sellPrefill !== undefined}
            />
            <AssetSendReceive assetKey={assetKey} />
        </Row>
    );
};
