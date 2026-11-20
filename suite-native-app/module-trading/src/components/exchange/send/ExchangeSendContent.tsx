import { useSelector } from 'react-redux';

import { cryptoIdToNetworkSymbol } from '@suite-common/trading';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountsRootState, selectAccountFormattedBalance } from '@suite-common/wallet-core';
import { useWatch } from '@suite-native/forms';
import {
    NetworkReserveBanner,
    useIsNetworkReserveBannerVisible,
} from '@suite-native/transaction-management';

import { ExchangeSendAssetPicker } from './ExchangeSendAssetPicker';
import { useExchangeFormContext } from '../../../hooks/exchange/useExchangeFormContext';

type ExchangeNetworkReserveBannerProps = {
    symbol: NetworkSymbol;
    contractAddress?: string;
};

const ExchangeNetworkReserveBanner = ({
    symbol,
    contractAddress,
}: ExchangeNetworkReserveBannerProps) => {
    const { control } = useExchangeFormContext();
    const [sendCryptoAmount, sendAccount] = useWatch({
        name: ['sendCryptoAmount', 'sendAccount'],
        control,
    });

    const formattedBalance = useSelector((state: AccountsRootState) =>
        selectAccountFormattedBalance(state, sendAccount?.key),
    );

    const shouldShowBanner = useIsNetworkReserveBannerVisible({
        symbol,
        contractAddress,
        amount: sendCryptoAmount,
        balance: formattedBalance,
    });

    if (!shouldShowBanner) {
        return null;
    }

    return <NetworkReserveBanner symbol={symbol} contractAddress={contractAddress} />;
};

export const ExchangeSendContent = () => {
    const { control } = useExchangeFormContext();

    const asset = useWatch({ name: 'sendAsset', control });
    const symbol = cryptoIdToNetworkSymbol(asset?.cryptoId);

    return (
        <>
            <ExchangeSendAssetPicker />
            {!!symbol && (
                <ExchangeNetworkReserveBanner
                    symbol={symbol}
                    contractAddress={asset?.contractAddress}
                />
            )}
        </>
    );
};
