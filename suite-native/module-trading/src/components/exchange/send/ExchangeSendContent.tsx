import { useSelector } from 'react-redux';

import { cryptoIdToSymbol } from '@suite-common/trading';
import { type AccountsRootState, selectAccountFormattedBalance } from '@suite-common/wallet-core';
import { HStack } from '@suite-native/atoms';
import {
    NetworkReserveBanner,
    useIsNetworkReserveBannerVisible,
} from '@suite-native/transaction-management';

import { ExchangeSendAccountCryptoBalance } from './ExchangeSendAccountCryptoBalance';
import { ExchangeSendAssetPicker } from './ExchangeSendAssetPicker';
import { useExchangeFormContext } from '../../../hooks/exchange/useExchangeFormContext';
import { TradeableAssetNetworkInfo } from '../../general/TradeableAssetNetworkInfo';

export const ExchangeSendContent = () => {
    const { watch } = useExchangeFormContext();

    const asset = watch('sendAsset');
    const sendCryptoAmount = watch('sendCryptoAmount');
    const sendAccount = watch('sendAccount');
    const symbol = asset ? cryptoIdToSymbol(asset.cryptoId) : undefined;

    const formattedBalance = useSelector((state: AccountsRootState) =>
        selectAccountFormattedBalance(state, sendAccount?.key),
    );

    const shouldShowBanner = useIsNetworkReserveBannerVisible({
        symbol,
        contractAddress: asset?.contractAddress,
        amount: sendCryptoAmount,
        balance: formattedBalance,
    });

    return (
        <>
            <ExchangeSendAssetPicker />
            <HStack justifyContent="space-between" alignItems="center" spacing="sp4">
                <TradeableAssetNetworkInfo asset={asset} />
                <ExchangeSendAccountCryptoBalance />
            </HStack>
            {symbol && shouldShowBanner && (
                <NetworkReserveBanner symbol={symbol} contractAddress={asset?.contractAddress} />
            )}
        </>
    );
};
