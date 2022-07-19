import React from 'react';
import styled, { css } from 'styled-components';

const rightAlignedStyles = css`
    text-align: right;
    justify-self: flex-end; /* text-align is not enough if you want to align for example button */
`;

const leftAlignedStyles = css`
    text-align: left;
    justify-self: flex-start;
`;

interface RowContentProps {
    color?: 'light' | 'dark';
    textAlign?: 'left' | 'right';
}

// this wrapper sets the text color of the item based on the  color: 'light' | 'dark' prop
const Column = styled.div<RowContentProps>`
    display: flex;
    align-items: center;
    align-self: start;
    min-height: 36px;
    color: ${({ color, theme }) =>
        color === 'light' ? `${theme.TYPE_LIGHT_GREY}` : `${theme.TYPE_DARK_GREY}`};

    /* content alignment styles */
    ${({ textAlign }) => (textAlign === 'left' ? leftAlignedStyles : rightAlignedStyles)}
`;

interface AmountRowProps {
    firstColumn?: React.ReactNode;
    secondColumn?: React.ReactNode;
    thirdColumn?: React.ReactNode;
    fourthColumn?: React.ReactNode;
    color?: 'light' | 'dark';
}

export const AmountRow = ({
    // set default values
    firstColumn,
    secondColumn,
    thirdColumn,
    fourthColumn,
    color = 'light',
}: AmountRowProps) => (
    <>
        <Column textAlign="left" color="light">
            {firstColumn}
        </Column>

        <Column textAlign="left" color={color}>
            {secondColumn}
        </Column>

        <Column textAlign="right" color={color}>
            {thirdColumn}
        </Column>

        <Column textAlign="right" color={color}>
            {fourthColumn}
        </Column>
    </>
);
