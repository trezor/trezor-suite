import styled, { keyframes, useTheme } from 'styled-components';
import { CSSColor, Color, spacingsPx, typography } from '@trezor/theme';
import { Icon } from '@suite-common/icons/src/webComponents';
import { IconName } from '@suite-common/icons';

import { getInputStateTextColor } from './InputStyles';
import { ReactNode } from 'react';
import { InputState } from './inputTypes';

export const BOTTOM_TEXT_MIN_HEIGHT = 26; // 1 line of text + top padding

interface BottomTextProps {
    inputState?: InputState;
    isDisabled?: boolean;
    icon?: IconName;
    withIcon?: boolean;
    children: ReactNode;
}

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
    padding: ${spacingsPx.xs} ${spacingsPx.sm} 0 ${spacingsPx.sm};
    min-height: ${BOTTOM_TEXT_MIN_HEIGHT}px;
    color: ${({ $inputState, $isDisabled, theme }) =>
        $isDisabled ? theme.textDisabled : getInputStateTextColor($inputState, theme)};
    ${typography.label}
    animation: ${slideDown} 0.18s ease-in-out forwards;
`;

//TODO: refactor as in Warning component
export const BottomText = ({
    inputState,
    isDisabled,
    children,
    icon,
    withIcon,
}: BottomTextProps) => {
    const theme = useTheme();
    const iconMap = {
        error: 'warningCircle',
        warning: 'warningCircle',
    } as const satisfies Record<InputState, IconName>;

    const iconColor: Color | CSSColor = isDisabled
        ? 'iconDisabled'
        : getInputStateTextColor(inputState, theme);

    let iconName;

    if (icon) {
        iconName = icon;
    } else if (inputState && iconMap[inputState]) {
        iconName = iconMap[inputState];
    }

    return (
        <Container $inputState={inputState} $isDisabled={isDisabled}>
            {withIcon && iconName && <Icon name={iconName} size="medium" color={iconColor} />}
            {children}
        </Container>
    );
};
