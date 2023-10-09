import styled, { keyframes, useTheme } from 'styled-components';
import { spacingsPx, typography } from '@trezor/theme';
import { Icon } from '@suite-common/icons/src/webComponents';
import { IconName } from '@suite-common/icons';

import { InputState } from '../../support/types';
import { getInputStateTextColor } from './InputStyles';
import { ReactNode } from 'react';

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

export const Container = styled.div<{ inputState?: InputState }>`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xxs};
    padding: ${spacingsPx.xs} ${spacingsPx.sm} 0 ${spacingsPx.sm};
    min-height: ${BOTTOM_TEXT_MIN_HEIGHT}px;
    color: ${({ inputState, theme }) => getInputStateTextColor(inputState, theme)};
    ${typography.label}
    animation: ${slideDown} 0.18s ease-in-out forwards;
`;

interface BottomTextProps {
    inputState?: InputState;
    icon?: IconName;
    children: ReactNode;
}

export const BottomText = ({ inputState, icon = 'warningCircle', children }: BottomTextProps) => {
    const theme = useTheme();

    return (
        <Container inputState={inputState}>
            {icon && (
                <Icon name={icon} size="medium" color={getInputStateTextColor(inputState, theme)} />
            )}

            {children}
        </Container>
    );
};
