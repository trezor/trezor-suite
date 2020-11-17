import React from 'react';
import styled from 'styled-components';
import { useTheme } from '@trezor/components';
import BigNumber from 'bignumber.js';

const StyledSign = styled.span<{ color: string }>`
    color: ${props => props.color};
    width: 1ch;
    margin-right: 0.3ch;
`;

interface Props {
    value: string | BigNumber | number | 'pos' | 'neg';
    placeholderOnly?: boolean;
    grayscale?: boolean;
    showMinusSign?: boolean;
    grayscaleColor?: string;
}
const Sign = ({
    value,
    placeholderOnly,
    grayscale,
    showMinusSign = true,
    grayscaleColor,
}: Props) => {
    const theme = useTheme();
    const defaultColor = grayscaleColor ?? theme.TYPE_DARK_GREY;
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

    if (placeholderOnly) {
        return <StyledSign color="transparent">+</StyledSign>;
    }

    if (isValuePos) {
        return <StyledSign color={grayscale ? defaultColor : theme.TYPE_GREEN}>+</StyledSign>;
    }

    if (!isValuePos && showMinusSign) {
        return <StyledSign color={grayscale ? defaultColor : theme.TYPE_RED}>–</StyledSign>;
    }
    return null;
};

export default Sign;
