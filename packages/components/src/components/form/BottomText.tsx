import styled, { keyframes } from 'styled-components';
import { spacingsPx, typography } from '@trezor/theme';
import { getInputStateTextColor } from './InputStyles';
import { ReactNode } from 'react';
import { InputState } from './inputTypes';

export const BOTTOM_TEXT_MIN_HEIGHT = 26; // 1 line of text + top padding

const slideDown = keyframes`
    from {
        opacity: 0;
        transform: translateY(-2px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
`;

export const Container = styled.div<{ $inputState?: InputState; $isDisabled?: boolean }>`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xxs};
    padding: ${spacingsPx.xs} ${spacingsPx.sm};
    min-height: ${BOTTOM_TEXT_MIN_HEIGHT}px;
    color: ${({ $inputState, $isDisabled, theme }) =>
        $isDisabled ? theme.textDisabled : getInputStateTextColor($inputState, theme)};
    ${typography.label}
    animation: ${slideDown} 0.18s ease-in-out forwards;
`;

interface BottomTextProps {
    inputState?: InputState;
    isDisabled?: boolean;
    iconComponent?: ReactNode;
    children: ReactNode;
}

export const BottomText = ({
    inputState,
    isDisabled,
    iconComponent,
    children,
}: BottomTextProps) => {
    return (
        <Container $inputState={inputState} $isDisabled={isDisabled}>
            {iconComponent}
            {children}
        </Container>
    );
};
