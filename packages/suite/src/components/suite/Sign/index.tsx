import React from 'react';
import styled from 'styled-components';
import { useTheme } from '@trezor/components';
import { SignValue } from '@suite-common/suite-types';
import { isSignValuePositive } from '@suite-common/formatters';

const StyledSign = styled.span<{ color: string }>`
    color: ${({ color }) => color};
    width: 1ch;
    margin-right: 0.3ch;
`;

interface SignProps {
    value: SignValue;
    placeholderOnly?: boolean;
    grayscale?: boolean;
    showMinusSign?: boolean;
    grayscaleColor?: string;
}

export const Sign = ({
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

    const isValuePositive = isSignValuePositive(value);

    if (placeholderOnly) {
        return <StyledSign color="transparent">+</StyledSign>;
    }

    if (isValuePositive) {
        return <StyledSign color={grayscale ? defaultColor : theme.TYPE_GREEN}>+</StyledSign>;
    }

    if (!isValuePositive && showMinusSign) {
        return <StyledSign color={grayscale ? defaultColor : theme.TYPE_RED}>–</StyledSign>;
    }
    return null;
};
