import { type ReactNode } from 'react';

import { type NetworkSymbol, getCoingeckoId } from '@suite-common/wallet-config';

import {
    type TransactionNotificationToken,
    type TransactionNotificationType,
} from './notificationsTypes';
import { AssetLogo } from '../AssetLogo/AssetLogo';
import { CoinLogo } from '../CoinLogo/CoinLogo';

type TransactionIconProps = {
    icon?: ReactNode;
    notificationType: TransactionNotificationType;
    symbol: NetworkSymbol;
    accountSymbol: NetworkSymbol;
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
        notificationType === 'tx-yield-supply' ||
        notificationType === 'tx-yield-withdraw' ||
        notificationType === 'tx-yield-claim';

    return (isApprovalType || isTransferTokenType || isYieldType) && !!token;
};

export const TransactionIcon = ({
    icon,
    notificationType,
    symbol,
    accountSymbol,
    token,
}: TransactionIconProps) => {
    if (icon) {
        return icon;
    }

    if (shouldDisplayAssetLogo({ notificationType, token }) && token) {
        return (
            <AssetLogo
                symbol={symbol}
                coingeckoId={getCoingeckoId(accountSymbol) ?? ''}
                contractAddress={token.contract ?? null}
                placeholder={token.symbol ?? token.name ?? symbol}
                size={20}
                shouldTryToFetch
            />
        );
    }

    return <CoinLogo symbol={symbol} size={20} />;
};
