import { Column, Row, Skeleton } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useLoadingSkeleton } from 'src/hooks/suite';
import { useResponsiveContext } from 'src/support/suite/ResponsiveContext';

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
                <Skeleton type="circle" size={24} />
            </Row>
        );
    }

    return (
        <Row gap={spacings.md} margin={8} data-testid="@account-menu/account-item-skeleton">
            <Skeleton type="circle" size={24} animate={shouldAnimate} />
            <Column alignItems="flex-start" gap={2}>
                <Skeleton width={140} animate={shouldAnimate} />
                <Skeleton animate={shouldAnimate} />
            </Column>
        </Row>
    );
};
