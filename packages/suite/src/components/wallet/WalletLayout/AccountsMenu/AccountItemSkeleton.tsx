import styled from 'styled-components';
import { useLoadingSkeleton } from 'src/hooks/suite';
import { Left, Right } from './AccountItem';
import { NavigationItemBase } from 'src/components/suite/Preloader/SuiteLayout/Sidebar/NavigationItem';
import { SkeletonCircle, SkeletonStack, SkeletonRectangle } from '@trezor/components';

interface AccountItemSkeletonProps {
    animate?: boolean;
}

const StyledSkeletonStack = styled(SkeletonStack)`
    > :last-child {
        margin-bottom: 0;
    }
`;

export const AccountItemSkeleton = (props: AccountItemSkeletonProps) => {
    const { shouldAnimate } = useLoadingSkeleton();

    const animate = props.animate ?? shouldAnimate;

    return (
        <NavigationItemBase>
            <Left>
                <SkeletonCircle size="18px" />
            </Left>
            <Right>
                <StyledSkeletonStack col childMargin="0px 0px 8px 0px">
                    <SkeletonRectangle width="180px" height="20px" animate={animate} />
                    <SkeletonRectangle width="100px" height="16px" animate={animate} />
                    <SkeletonRectangle width="100px" height="16px" animate={animate} />
                </StyledSkeletonStack>
            </Right>
        </NavigationItemBase>
    );
};
