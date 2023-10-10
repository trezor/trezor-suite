import { ReactNode } from 'react';
import styled, { useTheme } from 'styled-components';
import { transparentize } from 'polished';

import { Icon } from '../assets/Icon/Icon';
import { variables } from '../../config';

type Variant = 'learn' | 'info' | 'warning' | 'critical';

const getColor = (variant: Variant, colors: Record<Variant, string>) => colors[variant];
const getIcon = (variant: Variant) => {
    switch (variant) {
        case 'learn':
            return 'LIGHTBULB';
        case 'info':
            return 'INFO';
        default:
            return 'WARNING';
    }
};

const Wrapper = styled.div<{ variant: Variant; withIcon?: boolean }>`
    align-items: center;
    background: ${({ variant, theme }) =>
        transparentize(
            0.9,
            getColor(variant, {
                learn: theme.BG_GREEN,
                info: theme.TYPE_BLUE,
                warning: theme.TYPE_DARK_ORANGE,
                critical: theme.BG_RED,
            }),
        )};
    border-radius: 8px;
    color: ${({ variant, theme }) =>
        getColor(variant, {
            learn: theme.TYPE_DARK_GREY,
            info: theme.TYPE_BLUE,
            warning: theme.TYPE_DARK_ORANGE,
            critical: theme.TYPE_DARK_GREY,
        })};
    display: flex;
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    gap: 14px;
    justify-content: ${({ withIcon }) => !withIcon && 'center'};
    padding: 14px 20px;
    width: 100%;

    ${variables.SCREEN_QUERY.MOBILE} {
        align-items: stretch;
        flex-direction: column;
        gap: 8px;
    }
`;

export interface WarningProps {
    children: ReactNode;
    className?: string;
    variant?: Variant;
    withIcon?: boolean;
}

export const Warning = ({ children, className, variant = 'warning', withIcon }: WarningProps) => {
    const theme = useTheme();

    const iconColor = getColor(variant, {
        learn: theme.TYPE_GREEN,
        info: theme.TYPE_BLUE,
        warning: theme.TYPE_ORANGE,
        critical: theme.TYPE_RED,
    });
    const icon = getIcon(variant);

    return (
        <Wrapper variant={variant} withIcon={withIcon} className={className}>
            {withIcon && <Icon size={20} icon={icon} color={iconColor} />}
            {children}
        </Wrapper>
    );
};
