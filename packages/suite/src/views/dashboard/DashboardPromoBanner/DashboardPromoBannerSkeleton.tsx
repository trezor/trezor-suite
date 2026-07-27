import { selectShouldAnimateLoadingSkeleton } from '@suite/ui-animations';
import { Box, Skeleton } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
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
