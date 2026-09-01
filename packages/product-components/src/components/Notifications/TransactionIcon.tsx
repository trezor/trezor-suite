import { type ReactNode } from 'react';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    getWrappedNativeAddress,
    getWrappedNativeSymbol,
    isSupportedEthereumNetwork,
} from '@trezor/network-ethereum/constants';

import {
    type TransactionNotificationToken,
    type TransactionNotificationType,
} from './notificationsTypes';
import { TokenIcon } from '../TokenIcon/TokenIcon';

type TransactionIconProps = {
    icon?: ReactNode;
    notificationType: TransactionNotificationType;
    symbol: NetworkSymbol;
    token?: TransactionNotificationToken;
};

type ShouldDisplayAssetLogoProps = {
    notificationType: TransactionNotificationType;
    token?: TransactionNotificationToken;
};

const shouldDisplayAssetLogo = ({ notificationType, token }: ShouldDisplayAssetLogoProps) => {
    const isApprovalType = notificationType === 'tx-approved' || notificationType === 'tx-revoked';
    const isTransferTokenType =
        notificationType === 'tx-sent' || notificationType === 'tx-received';
    const isYieldType =
        notificationType === 'tx-yield-deposit' ||
        notificationType === 'tx-yield-withdraw' ||
        notificationType === 'tx-yield-claim';

    return (isApprovalType || isTransferTokenType || isYieldType) && !!token;
};

export const TransactionIcon = ({
    icon,
    notificationType,
    symbol,
    token,
}: TransactionIconProps) => {
    if (icon) {
        return icon;
    }

    // A wrap (ETH→WETH) is denominated in the wrapped-native token, so show its logo (e.g. WETH) to
    // match the amount. An unwrap is denominated in the native coin and uses the native icon below.
    if (notificationType === 'tx-wrap' && isSupportedEthereumNetwork(symbol)) {
        const wrappedNativeAddress = getWrappedNativeAddress(symbol);

        return (
            <TokenIcon
                symbol={symbol}
                contractAddress={wrappedNativeAddress}
                placeholder={getWrappedNativeSymbol(symbol)}
                size={20}
                shouldTryToFetch
            />
        );
    }

    if (shouldDisplayAssetLogo({ notificationType, token }) && token) {
        return (
            <TokenIcon
                symbol={symbol}
                contractAddress={token.contract ?? null}
                placeholder={token.symbol ?? token.name ?? symbol}
                size={20}
                shouldTryToFetch
            />
        );
    }

    return <TokenIcon symbol={symbol} size={20} />;
};
