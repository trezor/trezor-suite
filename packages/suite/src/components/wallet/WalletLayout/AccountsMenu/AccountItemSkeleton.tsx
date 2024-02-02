import styled from 'styled-components';
import { useLoadingSkeleton } from 'src/hooks/suite';
import { Left, Right } from './AccountItem';
import { NavigationItemBase } from 'src/components/suite/Preloader/SuiteLayout/Sidebar/NavigationItem';
import { SkeletonCircle, SkeletonStack, SkeletonRectangle } from '@trezor/components';

const StyledSkeletonStack = styled(SkeletonStack)`
    > :last-child {
        margin-bottom: 0;
    }
`;

export const AccountItemSkeleton = () => {
    const { shouldAnimate } = useLoadingSkeleton();

    return (
        <NavigationItemBase>
            <Left>
                <SkeletonCircle size="24px" />
            </Left>

            <Right>
                <StyledSkeletonStack col childMargin="0px 0px 8px 0px">
                    <SkeletonRectangle width="140px" animate={shouldAnimate} />
                    <SkeletonRectangle animate={shouldAnimate} />
                </StyledSkeletonStack>
            </Right>
        </NavigationItemBase>
    );
};
