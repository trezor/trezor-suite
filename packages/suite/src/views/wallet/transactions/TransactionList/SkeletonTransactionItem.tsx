import { Column, Row, Skeleton } from '@trezor/components';

export const SkeletonTransactionItem = () => (
    <Column gap={8}>
        <Row justifyContent="space-between">
            <Skeleton width={120} height={18} />
            <Skeleton width={80} height={18} />
        </Row>
        <Skeleton width="100%" height={70} animate />
        <Skeleton width="100%" height={70} animate />
        <Skeleton width="100%" height={70} animate />
    </Column>
);

export default SkeletonTransactionItem;
