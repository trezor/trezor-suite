import { type Network } from '@suite-common/wallet-config';
import { selectVisibleNonEmptyDeviceAccountsByNetworkSymbol } from '@suite-common/wallet-core';
import { Column, Note, Skeleton } from '@trezor/components';
import { WalletIcon } from '@trezor/icons';
import { spacings } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';

type AssetCoinNameProps = {
    network: Network;
};

export const AssetCoinName = ({ network }: AssetCoinNameProps) => {
    const { symbol, name } = network;
    const selectedAccounts = useSelector(state =>
        selectVisibleNonEmptyDeviceAccountsByNetworkSymbol(state, symbol),
    );

    return (
        <Column gap={spacings.xxxs}>
            <span data-testid="@dashboard/asset/name">{name}</span>
            <Note icon={WalletIcon}>{selectedAccounts.length}</Note>
        </Column>
    );
};

type AssetCoinNameSkeletonProps = {
    animate?: boolean;
};

export const AssetCoinNameSkeleton = ({ animate }: AssetCoinNameSkeletonProps) => (
    <Column gap={spacings.xxxs}>
        <Skeleton animate={animate} width={100} />
        <Skeleton animate={animate} width={60} />
    </Column>
);
