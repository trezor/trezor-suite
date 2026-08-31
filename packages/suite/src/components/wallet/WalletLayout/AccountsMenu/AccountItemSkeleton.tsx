import { selectShouldAnimateLoadingSkeleton } from '@suite/ui-animations';
import { useSelector } from '@suite-common/redux-utils';
import { Column, Row, Skeleton } from '@trezor/components';

import { useResponsiveContext } from 'src/support/suite/ResponsiveContext';

export const AccountItemSkeleton = () => {
    const shouldAnimate = useSelector(selectShouldAnimateLoadingSkeleton);
    const { isSidebarCollapsed } = useResponsiveContext();

    if (isSidebarCollapsed) {
        return (
            <Row
                gap={16}
                justifyContent="center"
                alignItems="center"
                data-testid="@account-menu/account-item-skeleton"
            >
                <Skeleton type="circle" size={24} />
            </Row>
        );
    }

    return (
        <Row gap={16} margin={8} data-testid="@account-menu/account-item-skeleton">
            <Skeleton type="circle" size={24} animate={shouldAnimate} />
            <Column alignItems="flex-start" gap={2}>
                <Skeleton width={140} animate={shouldAnimate} />
                <Skeleton animate={shouldAnimate} />
            </Column>
        </Row>
    );
};
