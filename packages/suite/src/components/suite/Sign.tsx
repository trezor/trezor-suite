import styled, { useTheme } from 'styled-components';

import { isSignValuePositive } from '@suite-common/formatters';
import { SignValue } from '@suite-common/suite-types';

const StyledSign = styled.span<{ $color: string }>`
    color: ${({ $color }) => $color};
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
    const defaultColor = grayscaleColor ?? theme.textDefault;

    if (value === undefined || value === null) {
        return null;
    }

    const isValuePositive = isSignValuePositive(value);

    if (placeholderOnly) {
        return <StyledSign $color="transparent">+</StyledSign>;
    }

    if (isValuePositive) {
        return (
            <StyledSign $color={grayscale ? defaultColor : theme.textPrimaryDefault}>+</StyledSign>
        );
    }

    if (!isValuePositive && showMinusSign) {
        return <StyledSign $color={grayscale ? defaultColor : theme.textAlertRed}>–</StyledSign>;
    }

    return null;
};
