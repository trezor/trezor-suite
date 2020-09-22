import React from 'react';
import styled, { css } from 'styled-components';
import { variables, colors } from '@trezor/components';

const rightAlignedStyles = css`
    text-align: right;
    justify-self: flex-end; /* text-align is not enough if you want to align for example button */
`;

const leftAlignedStyles = css`
    text-align: left;
    justify-self: flex-start;
`;

const RowWrapper = styled.div`
    font-size: ${variables.NEUE_FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    display: grid;
    grid-gap: 5px;
    grid-template-columns: minmax(100px, 140px) 2fr 1fr 1fr;
    align-items: center;
    height: 36px;

    @media only screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        grid-template-columns: 90px 2fr 1fr 1fr;
    }
`;

interface RowContentProps {
    color?: 'light' | 'dark';
    textAlign?: 'left' | 'right';
}

// this wrapper sets the text color of the item based on the  color: 'light' | 'dark' prop
const Row = styled.div<RowContentProps>`
    color: ${props => (props.color === 'light' ? `${colors.BLACK50}` : `${colors.BLACK25}`)};

    /* content alignment styles */
    ${props => (props.textAlign === 'left' ? leftAlignedStyles : rightAlignedStyles)}
`;

interface Props {
    firstColumn?: React.ReactNode;
    secondColumn?: React.ReactNode;
    thirdColumn?: React.ReactNode;
    fourthColumn?: React.ReactNode;
    color?: 'light' | 'dark';
}

const AmountRow = ({
    // set default values
    firstColumn,
    secondColumn,
    thirdColumn,
    fourthColumn,
    color = 'light',
}: Props) => {
    return (
        <RowWrapper>
            <Row textAlign="left" color="light">
                {firstColumn}
            </Row>
            <Row textAlign="left" color={color}>
                {secondColumn}
            </Row>
            <Row textAlign="right" color={color}>
                {thirdColumn}
            </Row>
            <Row textAlign="right" color={color}>
                {fourthColumn}
            </Row>
        </RowWrapper>
    );
};

export default AmountRow;
