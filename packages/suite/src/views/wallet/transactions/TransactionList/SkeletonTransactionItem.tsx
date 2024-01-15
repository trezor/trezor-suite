import { SkeletonStack, SkeletonSpread, SkeletonRectangle } from '@trezor/components';

export const SkeletonTransactionItem = () => (
    <SkeletonStack col childMargin="0px 0px 8px 0px">
        <SkeletonSpread>
            <SkeletonRectangle width="120px" height="18px" />
            <SkeletonRectangle width="80px" height="18px" />
        </SkeletonSpread>
        <SkeletonRectangle width="100%" height="70px" animate />
        <SkeletonRectangle width="100%" height="70px" animate />
        <SkeletonRectangle width="100%" height="70px" animate />
    </SkeletonStack>
);

export default SkeletonTransactionItem;
