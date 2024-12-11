import { Network } from '@suite-common/wallet-config';
import { selectVisibleNonEmptyDeviceAccountsByNetworkSymbol } from '@suite-common/wallet-core';
import { SkeletonRectangle, Note, Column } from '@trezor/components';
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
            {name}
            <Note iconName="standardWallet">{selectedAccounts.length}</Note>
        </Column>
    );
};

type AssetCoinNameSkeletonProps = {
    animate?: boolean;
};

export const AssetCoinNameSkeleton = ({ animate }: AssetCoinNameSkeletonProps) => (
    <Column gap={spacings.xxxs}>
        <SkeletonRectangle animate={animate} width={100} />
        <SkeletonRectangle animate={animate} width={60} />
    </Column>
);
