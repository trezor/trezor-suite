import React from 'react';
import styled, { css, DefaultTheme } from 'styled-components';
import { IconName } from '@suite-common/icons';
import { Icon } from '@suite-common/icons/src/webComponents';
import { borders, Color, spacings, spacingsPx, typography } from '@trezor/theme';
import { focusStyleTransition, getFocusShadowStyle } from '../../utils/utils';

const getBackgroundColor = (variant: BadgeVariant | undefined, theme: DefaultTheme) => {
    switch (variant) {
        case 'green':
            return theme.backgroundPrimarySubtleOnElevation0;
        case 'red':
            return theme.backgroundAlertRedSubtleOnElevation0;
        case 'bold':
            return theme.backgroundNeutralBold;
        case 'neutral':
        default:
            return theme.backgroundNeutralSubtleOnElevation0;
    }
};

const getTextColor = (
    variant: BadgeVariant | undefined,
    isDisabled: boolean | undefined,
    theme: DefaultTheme,
) => {
    if (isDisabled) {
        return theme.textDisabled;
    }

    switch (variant) {
        case 'green':
            return theme.textPrimaryDefault;
        case 'red':
            return theme.textAlertRed;
        case 'bold':
            return theme.textOnPrimary;
        case 'neutral':
        default:
            return theme.textSubdued;
    }
};

const getIconColor = (variant: BadgeVariant, isDisabled: boolean | undefined): Color => {
    if (isDisabled) {
        return 'iconDisabled';
    }

    switch (variant) {
        case 'green':
            return 'iconPrimaryDefault';
        case 'red':
            return 'iconAlertRed';
        case 'bold':
            return 'iconOnPrimary';
        case 'neutral':
        default:
            return 'iconSubdued';
    }
};

const getPadding = (size: BadgeSize) => {
    switch (size) {
        case 'tiny':
            return `0 ${spacings.xs - spacings.xxxs}px`;
        case 'small':
            return `0 ${spacingsPx.xs}`;
        default:
            return `${spacingsPx.xxxs} ${spacingsPx.xs}`;
    }
};

type BadgeContainerProps = Required<Pick<BadgeProps, 'size' | 'variant' | 'hasAlert'>>;

const Container = styled.button<BadgeContainerProps>`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xxs};
    padding: ${({ size }) => getPadding(size)};
    border-radius: ${borders.radii.full};
    border: 1px solid transparent;
    background: ${({ variant, theme }) => getBackgroundColor(variant, theme)};
    transition: ${focusStyleTransition};

    :disabled {
        background: ${({ theme }) => theme.backgroundNeutralSubtleOnElevation0};
    }

    ${getFocusShadowStyle()}

    ${({ onClick }) =>
        onClick &&
        css`
            transition: opacity 0.1s ease-out;
            cursor: pointer;

            :hover {
                opacity: 0.8;
            }
        `}

    ${({ theme, hasAlert }) =>
        hasAlert &&
        css`
            :not(:focus-visible) {
                border: 1px solid ${theme.borderAlertRed};
                box-shadow: 0 0 0 1px ${theme.borderAlertRed};
            }
        `}
`;

const Content = styled.span<Required<Pick<BadgeProps, 'size' | 'variant' | 'isDisabled'>>>`
    color: ${({ variant, isDisabled, theme }) => getTextColor(variant, isDisabled, theme)};
    ${({ size }) => (size === 'medium' ? typography.hint : typography.label)};
`;

type BadgeSize = 'tiny' | 'small' | 'medium';
type BadgeVariant = 'neutral' | 'green' | 'red' | 'bold';

export interface BadgeProps {
    size?: BadgeSize;
    variant?: BadgeVariant;
    isDisabled?: boolean;
    icon?: IconName;
    hasAlert?: boolean;
    onClick?: (e: any) => void;
    className?: string;
    children?: React.ReactNode;
}

export const Badge = ({
    size = 'medium',
    variant = 'neutral',
    isDisabled,
    icon,
    hasAlert,
    onClick,
    className,
    children,
}: BadgeProps) => (
    <Container
        size={size}
        variant={variant}
        disabled={!!isDisabled}
        hasAlert={!!hasAlert}
        onClick={onClick}
        className={className}
    >
        {icon && <Icon name={icon} color={getIconColor(variant, isDisabled)} />}

        <Content size={size} variant={variant} isDisabled={!!isDisabled}>
            {children}
        </Content>
    </Container>
);
