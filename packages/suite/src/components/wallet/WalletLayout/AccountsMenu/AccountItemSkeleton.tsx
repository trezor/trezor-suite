import { SkeletonCircle, SkeletonRectangle, SkeletonStack } from 'src/components/suite';
import { useLoadingSkeleton } from 'src/hooks/suite';
import { AccountHeader, Left, Right } from './AccountItem';

interface AccountItemSkeletonProps {
    animate?: boolean;
}

export const AccountItemSkeleton = (props: AccountItemSkeletonProps) => {
    const { shouldAnimate } = useLoadingSkeleton();
    const animate = props.animate ?? shouldAnimate;
    return (
        <AccountHeader>
            <Left>
                <SkeletonCircle size="18px" />
            </Left>
            <Right>
                <SkeletonStack col childMargin="0px 0px 8px 0px">
                    <SkeletonRectangle width="180px" height="20px" animate={animate} />

                    <SkeletonRectangle width="100px" height="16px" animate={animate} />

                    <SkeletonRectangle width="100px" height="16px" animate={animate} />
                </SkeletonStack>
            </Right>
        </AccountHeader>
    );
};
