import React from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';
import { useLoadingSkeleton } from '@suite-hooks';
import { SkeletonRectangle, Spread } from '@suite-components/Skeleton';
import { Wrapper, Left, Middle, Right, StyledIcon, FooterWrapper } from '@wallet-views/coinmarket';

const SkeletonWrapper = styled.div`
    display: flex;
    width: 100%;
    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        flex-direction: column;
    }
`;

const FooterSkeletonWrapper = styled(FooterWrapper)`
    justify-content: space-between;
    width: 100%;
`;

const Divider = styled(Wrapper)`
    display: flex;
    border-top: 1px solid ${props => props.theme.STROKE_GREY};
    padding: 0;
`;

const StyledLeft = styled(Left)`
    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        width: 100%;
    }
    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        margin-left: 0;
        justify-content: center;
    }
`;

const StyledSkeletonRectangle = styled(SkeletonRectangle)`
    margin-bottom: 27px;
`;

const StyledRight = styled(Right)`
    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        margin-left: 0;
        width: 100%;
        justify-content: flex-end;
    }
    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        margin-top: 20px;
        justify-content: center;
    }
`;

export const CoinmarketSkeleton = () => {
    const { shouldAnimate } = useLoadingSkeleton();
    return (
        <Wrapper responsiveSize="LG">
            <SkeletonWrapper>
                <Left>
                    <StyledSkeletonRectangle height="48px" width="100%" animate={shouldAnimate} />
                </Left>
                <Middle responsiveSize="LG">
                    <StyledIcon responsiveSize="LG" icon="TRANSFER" size={16} />
                </Middle>
                <Right>
                    <StyledSkeletonRectangle height="48px" width="100%" animate={shouldAnimate} />
                </Right>
            </SkeletonWrapper>
            <SkeletonWrapper>
                <Divider responsiveSize="LG" />
            </SkeletonWrapper>
            <FooterSkeletonWrapper>
                <StyledLeft>
                    <Spread childMargin="0 8px 0 0" alignItems="center">
                        <SkeletonRectangle height="20px" width="68px" animate={shouldAnimate} />
                        <SkeletonRectangle height="20px" width="180px" animate={shouldAnimate} />
                    </Spread>
                </StyledLeft>
                <StyledRight>
                    <SkeletonRectangle height="38px" width="200px" animate={shouldAnimate} />
                </StyledRight>
            </FooterSkeletonWrapper>
        </Wrapper>
    );
};
