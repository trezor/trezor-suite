import React from 'react';
import styled, { css } from 'styled-components';
import { colors, variables } from '@trezor/components';

interface WrapperProps {
    isGray?: boolean;
    isSmall?: boolean;
}

const BadgeWrapper = styled.div<WrapperProps>`
    display: flex;
    background: ${colors.BADGE_BLUE_BACKGROUND};
    color: ${colors.BADGE_BLUE_TEXT_COLOR};

    align-items: center;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    padding: 5px;
    border-radius: 3px;
    text-transform: uppercase;
    align-self: center;
    white-space: nowrap;

    ${props =>
        props.isGray &&
        css`
            background: ${colors.BADGE_GRAY_BACKGROUND};
            color: ${colors.BADGE_GRAY_TEXT_COLOR};
        `}

    ${props =>
        props.isSmall &&
        css`
            font-size: ${variables.FONT_SIZE.TINY};
        `}
`;

interface Props extends React.HTMLAttributes<HTMLDivElement> {
    isGray?: boolean;
    isSmall?: boolean;
    children: React.ReactNode;
}

const Badge = ({ isGray = false, isSmall = false, children, ...props }: Props) => {
    return (
        <BadgeWrapper isGray={isGray} isSmall={isSmall} {...props}>
            {children}
        </BadgeWrapper>
    );
};

export default Badge;
