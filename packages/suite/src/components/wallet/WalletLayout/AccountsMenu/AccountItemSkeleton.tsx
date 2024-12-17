import { SkeletonCircle, SkeletonRectangle, Row, Column } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useLoadingSkeleton } from 'src/hooks/suite';

import { useResponsiveContext } from '../../../../support/suite/ResponsiveContext';

export const AccountItemSkeleton = () => {
    const { shouldAnimate } = useLoadingSkeleton();
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
        <Row
            gap={spacings.md}
            margin={{ left: spacings.xs }}
            data-testid="@account-menu/account-item-skeleton"
        >
            <SkeletonCircle size="24px" />
            <Column alignItems="flex-start" gap={spacings.xs}>
                <SkeletonRectangle width="140px" animate={shouldAnimate} />
                <SkeletonRectangle animate={shouldAnimate} />
            </Column>
        </Row>
    );
};
