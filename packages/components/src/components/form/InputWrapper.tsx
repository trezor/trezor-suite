import { type ReactNode } from 'react';

import styled from 'styled-components';

import { borders } from '@trezor/theme';

import { type InputSize } from './types';
import { mapSizeToTypographyStyle } from './utils';
import { Text } from '../typography/Text/Text';

const Wrapper = styled.div<{
    $hasError?: boolean;
    $isDisabled?: boolean;
}>`
    width: 100%;
    position: relative;
    background: ${({ theme, $hasError }) =>
        $hasError ? theme.elementFillCriticalSofter : theme.elementFillField};
    border-radius: ${borders.radii.sm};
    outline-offset: -${borders.widths.small};
    outline: ${borders.widths.small} solid ${({ theme }) => theme.elementBorderField};
    transition:
        outline 0.2s,
        background-color 0.2s;

    &:hover {
        background: ${({ theme }) => theme.elementFillFieldHovered};
        outline-color: ${({ theme }) => theme.elementBorderFieldHovered};
    }

    ${({ $hasError, theme }) =>
        $hasError
            ? `
            outline-color: ${theme.elementBorderFieldError};
        `
            : `
            &:focus-within {
                outline-color: ${theme.elementBorderFieldFocused};
            }
        `}

    ${({ $isDisabled, theme }) =>
        $isDisabled &&
        `
            background: ${theme.elementFillFieldDisabled};
            outline-color: ${theme.elementBorderFieldDisabled};
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
    const content = (
        <Text
            typographyStyle={mapSizeToTypographyStyle(size)}
            intent="neutral"
            priority="secondary"
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
        <Wrapper $hasError={hasError} $isDisabled={isDisabled}>
            {content}
        </Wrapper>
    );
};
