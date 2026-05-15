import { Column, SkeletonCircle, SkeletonRectangle } from '@trezor/components';

import { useLoadingSkeleton } from 'src/hooks/suite';

export const EmptyWalletSkeleton = () => {
    const { shouldAnimate } = useLoadingSkeleton();

    return (
        <Column gap={24} data-testid="@dashboard/empty-wallet-skeleton" alignItems="center">
            <SkeletonCircle size={96} animate={shouldAnimate} />
            <SkeletonRectangle width={180} height={32} animate={shouldAnimate} borderRadius={4} />
            <SkeletonRectangle width={280} height={28} animate={shouldAnimate} borderRadius={4} />
        </Column>
    );
};
