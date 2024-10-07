import { Card, variables } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';
import { PropsWithChildren } from 'react';
import styled from 'styled-components';

export const CoinmarketWrapper = `
    display: flex;
    justify-content: space-between;
    padding-bottom: ${spacingsPx.xxxl};

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        flex-wrap: wrap;
    }
`;

const CoinmarketLeftWrapper = styled.div`
    width: 60%;

    ${variables.SCREEN_QUERY.BELOW_DESKTOP} {
        width: 49%;
    }

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        width: 100%;
    }
`;

const CoinmarketLeftPaddingWrapper = styled.div<{ $isWithoutPadding?: boolean }>`
    padding: ${({ $isWithoutPadding }) =>
        $isWithoutPadding ? 0 : `${spacingsPx.xl} ${spacingsPx.xl} ${spacingsPx.lg}`};

    ${variables.SCREEN_QUERY.BELOW_DESKTOP} {
        padding: ${spacingsPx.md};
    }

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        padding-bottom: ${spacingsPx.zero};
    }
`;

const CoinmarketRightWrapper = styled.div`
    width: 37%;

    ${variables.SCREEN_QUERY.BELOW_DESKTOP} {
        width: 49%;
    }

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        width: 100%;
        margin-top: ${spacingsPx.sm};
    }
`;

const CoinmarketRightPaddingWrapper = styled.div`
    padding: ${spacingsPx.xl} ${spacingsPx.xl} ${spacingsPx.xxxl};

    ${variables.SCREEN_QUERY.BELOW_DESKTOP} {
        padding: ${spacingsPx.md} ${spacingsPx.md} ${spacingsPx.xxl};
    }
`;

interface CoinmarketSideWrapperProps extends PropsWithChildren {
    side: 'left' | 'right';
    isLeftSideWithoutPadding?: boolean;
}

export const CoinmarketSideWrapper = ({
    side,
    isLeftSideWithoutPadding,
    children,
}: CoinmarketSideWrapperProps) => {
    if (side === 'left') {
        return (
            <CoinmarketLeftWrapper>
                <Card paddingType="none" height="100%">
                    <CoinmarketLeftPaddingWrapper $isWithoutPadding={isLeftSideWithoutPadding}>
                        {children}
                    </CoinmarketLeftPaddingWrapper>
                </Card>
            </CoinmarketLeftWrapper>
        );
    }

    return (
        <CoinmarketRightWrapper>
            <Card paddingType="none" height="100%">
                <CoinmarketRightPaddingWrapper>{children}</CoinmarketRightPaddingWrapper>
            </Card>
        </CoinmarketRightWrapper>
    );
};
