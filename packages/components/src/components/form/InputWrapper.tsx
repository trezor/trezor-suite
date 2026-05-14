import { type ReactNode } from 'react';

import styled from 'styled-components';

import { type Elevation, borders, mapElevationToBackground } from '@trezor/theme';

import { type InputSize } from './types';
import { mapSizeToTypographyStyle } from './utils';
import { useElevation } from '../ElevationContext/ElevationContext';
import { Text } from '../typography/Text/Text';

const Wrapper = styled.div<{
    $elevation: Elevation;
    $hasError?: boolean;
    $isDisabled?: boolean;
}>`
    width: 100%;
    position: relative;
    background: ${({ $elevation, theme, $hasError }) =>
        $hasError
            ? theme.legacyBackgroundAlertRedSubtleOnElevation1
            : mapElevationToBackground({ theme, $elevation })};
    border-radius: ${borders.radii.sm};
    outline: ${borders.widths.large} solid
        ${({ $hasError, theme }) => ($hasError ? theme.elementBorderFieldError : 'transparent')};
    transition:
        outline-color,
        background-color 0.1s;

    &:focus-within {
        outline-color: ${({ theme }) => theme.elementBorderFieldFocused};
    }

    ${({ $isDisabled, theme }) =>
        $isDisabled &&
        `
            background: ${theme.elementFillBoldDisabled};
            pointer-events: none;
            cursor: default;
        `}
`;

export type InputWrapperProps = {
    hasError?: boolean;
    isDisabled?: boolean;
    size?: InputSize;
    isClean?: boolean;
    children: ReactNode;
};

export const InputWrapper = ({
    hasError,
    isClean,
    isDisabled,
    size = 'large',
    children,
}: InputWrapperProps) => {
    const { elevation } = useElevation();

    const content = (
        <Text
            typographyStyle={mapSizeToTypographyStyle(size)}
            intent="neutral"
            isDisabled={isDisabled}
            as="div"
            width="100%"
        >
            {children}
        </Text>
    );

    return isClean ? (
        content
    ) : (
        <Wrapper $elevation={elevation} $hasError={hasError} $isDisabled={isDisabled}>
            {content}
        </Wrapper>
    );
};
