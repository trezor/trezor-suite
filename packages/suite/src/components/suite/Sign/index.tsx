import React from 'react';
import styled from 'styled-components';
import { colors } from '@trezor/components';
import BigNumber from 'bignumber.js';

const StyledSign = styled.span<{ color: string }>`
    color: ${props => props.color};
    width: 1ch;
    margin-right: 0.3ch;
`;

interface Props {
    value: string | BigNumber | number | 'pos' | 'neg';
    grayscale?: boolean;
    showMinusSign?: boolean;
    grayscaleColor?: string;
}
const Sign = ({
    value,
    grayscale,
    showMinusSign = true,
    grayscaleColor = colors.NEUE_TYPE_DARK_GREY,
}: Props) => {
    let isValuePos = false;
    if (value === undefined || value === null) {
        return null;
    }

    if (value === 'pos') {
        isValuePos = true;
    } else if (value === 'neg') {
        isValuePos = false;
    } else {
        isValuePos = new BigNumber(value).gte(0);
    }

    if (isValuePos) {
        return (
            <StyledSign color={grayscale ? grayscaleColor : colors.NEUE_TYPE_GREEN}>+</StyledSign>
        );
    }

    if (!isValuePos && showMinusSign) {
        return <StyledSign color={grayscale ? grayscaleColor : colors.NEUE_TYPE_RED}>–</StyledSign>;
    }
    return null;
};

export default Sign;
