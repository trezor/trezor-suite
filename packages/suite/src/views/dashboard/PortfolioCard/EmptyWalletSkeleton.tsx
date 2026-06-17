import { Column, Skeleton } from '@trezor/components';

import { useLoadingSkeleton } from 'src/hooks/suite';

export const EmptyWalletSkeleton = () => {
    const { shouldAnimate } = useLoadingSkeleton();

    return (
        <Column gap={24} data-testid="@dashboard/empty-wallet-skeleton" alignItems="center">
            <Skeleton type="circle" size={96} animate={shouldAnimate} />
            <Skeleton width={180} height={32} animate={shouldAnimate} borderRadius={4} />
            <Skeleton width={280} height={28} animate={shouldAnimate} borderRadius={4} />
        </Column>
    );
};
