import styled from 'styled-components';
import { useLoadingSkeleton } from 'src/hooks/suite';
import { Left, Right } from './AccountItem';
import { SkeletonCircle, SkeletonStack, SkeletonRectangle } from '@trezor/components';

const Wrapper = styled.div`
    margin-left: 18px;
    display: flex;
    align-items: center;
    flex: 1;
`;

const StyledSkeletonStack = styled(SkeletonStack)`
    > :last-child {
        margin-bottom: 0;
    }
`;

export const AccountItemSkeleton = () => {
    const { shouldAnimate } = useLoadingSkeleton();

    return (
        <Wrapper data-testid="@account-menu/account-item-skeleton">
            <Left>
                <SkeletonCircle size="24px" />
            </Left>

            <Right>
                <StyledSkeletonStack $col $childMargin="0px 0px 8px 0px">
                    <SkeletonRectangle width="140px" animate={shouldAnimate} />
                    <SkeletonRectangle animate={shouldAnimate} />
                </StyledSkeletonStack>
            </Right>
        </Wrapper>
    );
};
