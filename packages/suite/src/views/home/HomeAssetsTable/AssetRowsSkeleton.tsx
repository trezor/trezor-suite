import { selectShouldAnimateLoadingSkeleton } from '@suite/ui-animations';
import { Card, Column, Row, Skeleton } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

const SKELETON_ROW_COUNT = 3;

type AssetRowsSkeletonProps = {
    'data-testid'?: string;
};

export const AssetRowsSkeleton = ({ 'data-testid': dataTestId }: AssetRowsSkeletonProps) => {
    const shouldAnimate = useSelector(selectShouldAnimateLoadingSkeleton);

    return (
        <Card data-testid={dataTestId}>
            <Column gap={20}>
                {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
                    <Row key={index} gap={12} justifyContent="space-between">
                        <Row gap={12}>
                            <Skeleton type="circle" size={32} animate={shouldAnimate} />
                            <Column gap={4}>
                                <Skeleton width={120} height={16} animate={shouldAnimate} />
                                <Skeleton width={80} height={12} animate={shouldAnimate} />
                            </Column>
                        </Row>
                        <Skeleton width={80} height={16} animate={shouldAnimate} />
                    </Row>
                ))}
            </Column>
        </Card>
    );
};
