import { ReactNode } from 'react';
import styled, { css } from 'styled-components';

const rightAlignedStyles = css`
    text-align: right;
    justify-self: flex-end; /* text-align is not enough if you want to align for example button */
`;

const leftAlignedStyles = css`
    text-align: left;
    justify-self: flex-start;
`;

const Column = styled.div<{ textAlign: 'left' | 'right' }>`
    display: flex;
    align-items: center;
    align-self: start;
    min-height: 32px;
    white-space: nowrap;
    color: ${({ theme }) => `${theme.TYPE_LIGHT_GREY}`};

    ${({ textAlign }) => (textAlign === 'left' ? leftAlignedStyles : rightAlignedStyles)};
`;

interface AmountRowProps {
    firstColumn?: ReactNode;
    secondColumn?: ReactNode;
    thirdColumn?: ReactNode;
    fourthColumn?: ReactNode;
}

export const AmountRow = ({
    firstColumn,
    secondColumn,
    thirdColumn,
    fourthColumn,
}: AmountRowProps) => (
    <>
        <Column textAlign="left">{firstColumn}</Column>

        <Column textAlign="left">{secondColumn}</Column>

        <Column textAlign="right">{thirdColumn}</Column>

        <Column textAlign="right">{fourthColumn}</Column>
    </>
);
