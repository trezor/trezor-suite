import { SkeletonRectangle, Spread, Stack } from 'src/components/suite/Skeleton';

export const SkeletonTransactionItem = () => (
    <Stack col childMargin="0px 0px 8px 0px">
        <Spread>
            <SkeletonRectangle width="120px" height="18px" />
            <SkeletonRectangle width="80px" height="18px" />
        </Spread>
        <SkeletonRectangle width="100%" height="70px" animate />
        <SkeletonRectangle width="100%" height="70px" animate />
        <SkeletonRectangle width="100%" height="70px" animate />
    </Stack>
);

export default SkeletonTransactionItem;
