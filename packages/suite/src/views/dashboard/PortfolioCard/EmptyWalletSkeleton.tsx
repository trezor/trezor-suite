import { selectShouldAnimateLoadingSkeleton } from '@suite/ui-animations';
import { Column, Skeleton } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

export const EmptyWalletSkeleton = () => {
    const shouldAnimate = useSelector(selectShouldAnimateLoadingSkeleton);

    return (
        <Column gap={24} data-testid="@dashboard/empty-wallet-skeleton" alignItems="center">
            <Skeleton type="circle" size={96} animate={shouldAnimate} />
            <Skeleton width={180} height={32} animate={shouldAnimate} borderRadius={4} />
            <Skeleton width={280} height={28} animate={shouldAnimate} borderRadius={4} />
        </Column>
    );
};
