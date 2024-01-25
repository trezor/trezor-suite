import { ReactNode } from 'react';
import styled, { DefaultTheme, useTheme } from 'styled-components';

import { Icon, Button, Spinner, variables, ButtonProps, useElevation } from '@trezor/components';
import { Elevation, borders, spacingsPx, typography } from '@trezor/theme';
import { TrezorLink } from './TrezorLink';
import { ButtonVariant } from '@trezor/components/src/components/buttons/buttonStyleUtils';

// TODO: move to components

type ButtonType = ButtonProps & { href?: string };

export type NotificationCardVariant = Extract<ButtonVariant, 'info' | 'warning' | 'destructive'>;

interface NotificationCardProps {
    children: ReactNode;
    variant: NotificationCardVariant;
    isLoading?: boolean;
    button?: ButtonType;
    className?: string;
    ['data-test']?: string;
}

const getIcon = (variant: NotificationCardVariant) => {
    switch (variant) {
        case 'info':
            return 'INFO';
        case 'warning':
            return 'WARNING';
        case 'destructive':
            return 'WARNING';
        default:
            return null;
    }
};
const getButtonVariant = (variant: NotificationCardVariant) => {
    switch (variant) {
        case 'info':
            return 'info';
        case 'warning':
            return 'warning';
        case 'destructive':
            return 'destructive';
        default:
            return 'tertiary';
    }
};

const getMainColor = (variant: NotificationCardVariant, theme: DefaultTheme) => {
    switch (variant) {
        case 'info':
            return theme.backgroundAlertBlueBold;
        case 'warning':
            return theme.backgroundAlertYellowBold;
        case 'destructive':
            return theme.backgroundAlertRedBold;
        default:
            return 'transparent';
    }
};
const getBackgroundColor = (variant: NotificationCardVariant, theme: DefaultTheme) => {
    switch (variant) {
        case 'info':
            return theme.backgroundAlertBlueSubtleOnElevation0;
        case 'warning':
            return theme.backgroundAlertYellowSubtleOnElevation0;
        case 'destructive':
            return theme.backgroundAlertRedSubtleOnElevation0;
        default:
            return 'transparent';
    }
};

const Wrapper = styled.div<{ elevation: Elevation; variant: NotificationCardVariant }>`
    display: flex;
    border-radius: ${borders.radii.sm};
    padding: ${spacingsPx.sm} ${spacingsPx.lg};
    align-items: center;
    background: ${({ theme, variant }) => getBackgroundColor(variant, theme)};
    margin-bottom: ${spacingsPx.xs};
`;

const IconWrapper = styled.div`
    margin-right: ${spacingsPx.md};

    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        display: none;
    }
`;

const Body = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    color: ${({ theme }) => theme.textDefault};
    ${typography.hint}
`;

const CardButton = ({ href, ...props }: ButtonType) => {
    if (href) {
        <TrezorLink variant="nostyle" href={href}>
            <Button {...props} />
        </TrezorLink>;
    }
    return <Button {...props} />;
};

export const NotificationCard = ({
    variant,
    button: buttonProps,
    children,
    className,
    isLoading,
    ...props
}: NotificationCardProps) => {
    const theme = useTheme();
    const { elevation } = useElevation();

    const buttonVariant = getButtonVariant(variant);

    const iconElement = getIcon(variant);
    return (
        <Wrapper
            variant={variant}
            className={className}
            elevation={elevation}
            data-test={props['data-test']}
        >
            <IconWrapper>
                {isLoading ? (
                    <Spinner size={22} />
                ) : (
                    iconElement && (
                        <Icon icon={iconElement} size={22} color={getMainColor(variant, theme)} />
                    )
                )}
            </IconWrapper>
            <Body>{children}</Body>
            {buttonProps && <CardButton {...buttonProps} size="tiny" variant={buttonVariant} />}
        </Wrapper>
    );
};
