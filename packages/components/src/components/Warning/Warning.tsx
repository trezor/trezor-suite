import { ReactNode } from 'react';
import styled, { useTheme } from 'styled-components';
import { transparentize } from 'polished';

import { Icon } from '../assets/Icon/Icon';
import { variables } from '../../config';
import { borders, spacingsPx, typography } from '@trezor/theme';

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
                learn: theme.backgroundPrimarySubtleOnElevation0,
                info: theme.backgroundAlertBlueSubtleOnElevation0,
                warning: theme.backgroundAlertYellowSubtleOnElevation0,
                critical: theme.backgroundAlertRedSubtleOnElevation0,
            }),
        )};
    border-radius: ${borders.radii.xxs};
    color: ${({ variant, theme }) =>
        getColor(variant, {
            learn: theme.textPrimaryDefault,
            info: theme.textAlertBlue,
            warning: theme.textAlertYellow,
            critical: theme.textAlertRed,
        })};
    display: flex;
    ${typography.hint}
    gap: ${spacingsPx.sm};
    justify-content: ${({ withIcon }) => !withIcon && 'center'};
    padding: ${spacingsPx.sm} ${spacingsPx.lg};
    width: 100%;

    ${variables.SCREEN_QUERY.MOBILE} {
        align-items: stretch;
        flex-direction: column;
        gap: ${spacingsPx.xs};
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
        learn: theme.iconPrimaryDefault,
        info: theme.iconAlertBlue,
        warning: theme.iconAlertYellow,
        critical: theme.iconAlertRed,
    });
    const icon = getIcon(variant);

    return (
        <Wrapper variant={variant} withIcon={withIcon} className={className}>
            {withIcon && <Icon size={20} icon={icon} color={iconColor} />}
            {children}
        </Wrapper>
    );
};
