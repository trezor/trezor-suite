import { Column, Row, SkeletonCircle, SkeletonRectangle } from '@trezor/components';

import { useLoadingSkeleton } from 'src/hooks/suite';

export const EmptyWalletSkeleton = () => {
    const { shouldAnimate } = useLoadingSkeleton();

    return (
        <Column gap={4} data-testid="@dashboard/empty-wallet-skeleton" alignItems="center">
            <SkeletonCircle size={96} animate={shouldAnimate} />
            <SkeletonRectangle width={180} height={20} animate={shouldAnimate} borderRadius={6} />
            <SkeletonRectangle width={280} height={14} animate={shouldAnimate} borderRadius={4} />
            <Row gap={12} margin={{ top: 24 }}>
                <SkeletonRectangle
                    width={120}
                    height={44}
                    animate={shouldAnimate}
                    borderRadius={12}
                />
                <SkeletonRectangle
                    width={120}
                    height={44}
                    animate={shouldAnimate}
                    borderRadius={12}
                />
            </Row>
        </Column>
    );
};
