import { Row, Table, SkeletonRectangle } from '@trezor/components';
import { AssetCoinLogoSkeleton } from '../AssetCoinLogo';
import { useLoadingSkeleton } from 'src/hooks/suite';

type AssetRowSkeletonProps = {
    isAnimating?: boolean;
};

export const AssetRowSkeleton = ({ isAnimating }: AssetRowSkeletonProps) => {
    const { shouldAnimate } = useLoadingSkeleton();

    const animate = isAnimating ?? shouldAnimate;

    return (
        <Table.Row>
            <Table.Cell colSpan={3}>
                <Row>
                    <AssetCoinLogoSkeleton animate={animate} />
                    <SkeletonRectangle animate={animate} width={100} />
                </Row>
            </Table.Cell>
            <Table.Cell>
                <SkeletonRectangle animate={animate} width={100} />
            </Table.Cell>
            <Table.Cell>
                <SkeletonRectangle animate={animate} />
            </Table.Cell>
            <Table.Cell>
                <SkeletonRectangle animate={animate} width={50} />
            </Table.Cell>
            <Table.Cell colSpan={2}>
                <Row gap={16}>
                    <SkeletonRectangle animate={animate} width={58} height={38} borderRadius={19} />
                    <SkeletonRectangle animate={animate} width={38} height={38} borderRadius={25} />
                </Row>
            </Table.Cell>
        </Table.Row>
    );
};
