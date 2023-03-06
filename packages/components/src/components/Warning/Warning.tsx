import React from 'react';
import styled from 'styled-components';
import { transparentize } from 'polished';

import { Icon } from '../Icon';
import { useTheme } from '../../utils';
import { variables } from '../../config';

type Variant = 'info' | 'warning' | 'critical';

const getColor = (variant: Variant, colors: Record<Variant, string>) => colors[variant];

const Wrapper = styled.div<{ variant: Variant; withIcon?: boolean }>`
    align-items: center;
    background: ${({ variant, theme }) =>
        transparentize(
            0.9,
            getColor(variant, {
                info: theme.TYPE_BLUE,
                warning: theme.TYPE_DARK_ORANGE,
                critical: theme.BG_RED,
            }),
        )};
    border-radius: 8px;
    color: ${({ variant, theme }) =>
        getColor(variant, {
            info: theme.TYPE_BLUE,
            warning: theme.TYPE_DARK_ORANGE,
            critical: theme.TYPE_DARK_GREY,
        })};
    display: flex;
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    justify-content: ${({ withIcon }) => !withIcon && 'center'};
    padding: 14px 20px;
    width: 100%;
`;

const StyledIcon = styled(Icon)`
    margin-right: 14px;
`;

interface WarningProps {
    children: React.ReactNode;
    className?: string;
    variant?: Variant;
    withIcon?: boolean;
}

export const Warning = ({ children, className, variant = 'warning', withIcon }: WarningProps) => {
    const theme = useTheme();

    const color = getColor(variant, {
        info: theme.TYPE_BLUE,
        warning: theme.TYPE_ORANGE,
        critical: theme.TYPE_RED,
    });
    const icon = variant === 'info' ? 'INFO' : 'WARNING';

    return (
        <Wrapper variant={variant} withIcon={withIcon} className={className}>
            {withIcon && <StyledIcon size={20} icon={icon} color={color} />}
            {children}
        </Wrapper>
    );
};
