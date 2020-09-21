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
`;

interface RowContentProps {
    color?: 'light' | 'dark';
}

// this wrapper sets the text color of the item based on the  color: 'light' | 'dark' prop
const ColorizedWrapper = styled.div<RowContentProps>`
    color: ${props => (props.color === 'light' ? `${colors.BLACK50}` : `${colors.BLACK25}`)};
`;

const FirstCol = styled.div`
    color: ${colors.BLACK50};
    ${leftAlignedStyles}
`;

const SecondCol = styled(ColorizedWrapper)`
    ${leftAlignedStyles}
`;

const ThirdCol = styled(ColorizedWrapper)`
    ${rightAlignedStyles}
`;

const FourthCol = styled(ColorizedWrapper)`
    ${rightAlignedStyles}
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
    firstColumn = <div />,
    secondColumn = <div />,
    thirdColumn = <div />,
    fourthColumn = <div />,
    color = 'light',
}: Props) => {
    return (
        <RowWrapper>
            <FirstCol>{firstColumn}</FirstCol>
            <SecondCol color={color}>{secondColumn}</SecondCol>
            <ThirdCol color={color}>{thirdColumn}</ThirdCol>
            <FourthCol color={color}>{fourthColumn}</FourthCol>
        </RowWrapper>
    );
};

export default AmountRow;
