import { selectShouldAnimateLoadingSkeleton } from '@suite/ui-animations';
import { Row, Skeleton, Table } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

import { AssetCoinLogoSkeleton } from '../AssetCoinLogo';

type AssetRowSkeletonProps = {
    isAnimating?: boolean;
};

export const AssetRowSkeleton = ({ isAnimating }: AssetRowSkeletonProps) => {
    const shouldAnimate = useSelector(selectShouldAnimateLoadingSkeleton);

    const animate = isAnimating ?? shouldAnimate;

    return (
        <Table.Row>
            <Table.Cell colSpan={3}>
                <Row>
                    <AssetCoinLogoSkeleton animate={animate} />
                    <Skeleton animate={animate} width={100} />
                </Row>
            </Table.Cell>
            <Table.Cell>
                <Skeleton animate={animate} width={100} />
            </Table.Cell>
            <Table.Cell>
                <Skeleton animate={animate} />
            </Table.Cell>
            <Table.Cell>
                <Skeleton animate={animate} width={50} />
            </Table.Cell>
            <Table.Cell colSpan={2}>
                <Row gap={16}>
                    <Skeleton animate={animate} width={58} height={38} borderRadius={20} />
                    <Skeleton animate={animate} width={38} height={38} borderRadius={24} />
                </Row>
            </Table.Cell>
        </Table.Row>
    );
};
