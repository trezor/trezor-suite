import { useLoadingSkeleton } from 'src/hooks/suite';
import { SkeletonCircle, SkeletonRectangle, Row, Column } from '@trezor/components';
import { spacings } from '@trezor/theme';

export const AccountItemSkeleton = () => {
    const { shouldAnimate } = useLoadingSkeleton();

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
