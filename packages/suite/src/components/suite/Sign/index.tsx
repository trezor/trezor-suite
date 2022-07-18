import React from 'react';
import styled from 'styled-components';
import { useTheme } from '@trezor/components';
import BigNumber from 'bignumber.js';

const StyledSign = styled.span<{ color: string }>`
    color: ${props => props.color};
    width: 1ch;
    margin-right: 0.3ch;
`;

export const isValuePositive = (value: SignValue) => {
    let isValuePos;

    if (!value) {
        return;
    }

    if (value === 'pos') {
        isValuePos = true;
    } else if (value === 'neg') {
        isValuePos = false;
    } else {
        isValuePos = new BigNumber(value).gte(0);
    }

    return isValuePos;
};

export type SignValue = string | BigNumber | number | 'pos' | 'neg' | null;

interface SignProps {
    value: SignValue;
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
}: SignProps) => {
    const theme = useTheme();
    const defaultColor = grayscaleColor ?? theme.TYPE_DARK_GREY;

    if (value === undefined || value === null) {
        return null;
    }

    const isValuePos = isValuePositive(value);

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
