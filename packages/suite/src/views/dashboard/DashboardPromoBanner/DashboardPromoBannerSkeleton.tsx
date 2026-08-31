import { selectShouldAnimateLoadingSkeleton } from '@suite/ui-animations';
import { useSelector } from '@suite-common/redux-utils';
import { Box, Skeleton } from '@trezor/components';

import { useIsContentBelowBreakpoint } from 'src/support/suite/ContentFlex';

export const DashboardPromoBannerSkeleton = () => {
    const shouldAnimate = useSelector(selectShouldAnimateLoadingSkeleton);
    const isVerticalLayout = useIsContentBelowBreakpoint();

    return (
        <Box data-testid="@dashboard/promo-banner/skeleton">
            <Skeleton
                width="100%"
                height={isVerticalLayout ? 320 : 213}
                borderRadius={12}
                animate={shouldAnimate}
            />
        </Box>
    );
};
