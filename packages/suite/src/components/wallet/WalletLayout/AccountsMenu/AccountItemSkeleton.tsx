import { selectShouldAnimateLoadingSkeleton } from '@suite/skeleton';
import { Column, Row, SkeletonCircle, SkeletonRectangle } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';
import { useResponsiveContext } from 'src/support/suite/ResponsiveContext';

export const AccountItemSkeleton = () => {
    const shouldAnimate = useSelector(selectShouldAnimateLoadingSkeleton);
    const { isSidebarCollapsed } = useResponsiveContext();

    if (isSidebarCollapsed) {
        return (
            <Row
                gap={spacings.md}
                justifyContent="center"
                alignItems="center"
                data-testid="@account-menu/account-item-skeleton"
            >
                <SkeletonCircle size="24px" />
            </Row>
        );
    }

    return (
        <Row gap={spacings.md} margin={8} data-testid="@account-menu/account-item-skeleton">
            <SkeletonCircle size="24px" animate={shouldAnimate} />
            <Column alignItems="flex-start" gap={2}>
                <SkeletonRectangle width="140px" animate={shouldAnimate} />
                <SkeletonRectangle animate={shouldAnimate} />
            </Column>
        </Row>
    );
};
