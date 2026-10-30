import { useEffect } from 'react';

import { type CryptoId } from 'invity-api';

import { selectWalletAssetContractAddress, selectWalletAssetSymbol } from '@suite-common/assets';
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

import { useSelector } from 'src/hooks/suite';
import { AssetDetailMenu } from 'src/views/home/AssetDetail/AssetDetailMenu/AssetDetailMenu';
import { selectRoutedAssetKey } from 'src/views/home/AssetDetail/selectRoutedAssetKey';

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
    const symbol = useSelector(state => selectWalletAssetSymbol(state, assetKey));
    const contractAddress = useSelector(state => selectWalletAssetContractAddress(state, assetKey));
    const tradeAccountKeys = useSelector(selectRoutedAssetTradeAccountKeys);
    const cryptoId = symbol === undefined ? undefined : getCryptoId(symbol, contractAddress);
    const services = useSelector(
        state => selectTradingCoinInfoByCryptoId(state, cryptoId)?.services,
    );

    useEffect(() => {
        const request = dispatch(tradingThunks.loadInitialDataThunk({ activeSection: 'buy' }));

        return () => {
            request.abort();
        };
    }, [dispatch]);

    if (assetKey === undefined || symbol === undefined) return null;

    const buyPrefill = getTradePrefill(cryptoId, tradeAccountKeys.buy);
    const sellPrefill = getTradePrefill(cryptoId, tradeAccountKeys.sell);

    return (
        <Row gap={12}>
            <AssetDetailMenu assetKey={assetKey} />
            <TradeActions
                source={{ from: 'asset/header', networkSymbol: symbol, contractAddress }}
                prefill={{ buy: buyPrefill, sell: sellPrefill }}
                canBuy={!!services?.buy && buyPrefill !== undefined}
                canSell={!!services?.sell && sellPrefill !== undefined}
            />
            <AssetSendReceive assetKey={assetKey} />
        </Row>
    );
};
