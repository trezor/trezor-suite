import { ReactNode } from 'react';
import styled, { DefaultTheme, useTheme } from 'styled-components';
import { Button, Icon, variables } from '@trezor/components';
import { borders, spacingsPx, typography } from '@trezor/theme';
import { ButtonVariant } from '@trezor/components/src/components/buttons/buttonStyleUtils';

export type BannerVariant = Extract<ButtonVariant, 'info' | 'warning' | 'destructive'>;

interface BannerProps {
    body: ReactNode;
    variant: BannerVariant;
    action?: {
        label: ReactNode | string;
        onClick: () => void;
        'data-test': string;
    };
    dismissal?: {
        onClick: () => void;
        'data-test': string;
    };
    className?: string;
}

const getBackgroundColor = (variant: BannerVariant, theme: DefaultTheme) => {
    switch (variant) {
        case 'info':
            return theme.backgroundAlertBlueBold;
        case 'warning':
            return theme.backgroundAlertYellowBold;
        case 'destructive':
            return theme.backgroundAlertRedBold;
        default:
            return theme.backgroundAlertBlueBold;
    }
};

const getForegroundColor = (variant: BannerVariant, theme: DefaultTheme) => {
    switch (variant) {
        case 'info':
            return theme.textDefaultInverse;
        case 'warning':
            return theme.textDefaultInverse;
        case 'destructive':
            return theme.textDefaultInverse;
        default:
            return theme.textDefaultInverse;
    }
};
const getIcon = (variant: BannerVariant, theme: DefaultTheme) => {
    switch (variant) {
        case 'info':
            return <Icon icon="INFO" size={22} color={theme.textDefaultInverse} />; // @TODO iconDefaultInverse
        case 'warning':
            return <Icon icon="WARNING" size={22} color={theme.textDefaultInverse} />; // @TODO iconDefaultInverse
        case 'destructive':
            return <Icon icon="WARNING" size={22} color={theme.textDefaultInverse} />; // @TODO iconDefaultInverse
        default:
            return null;
    }
};

const Wrapper = styled.div<{ variant: BannerVariant }>`
    display: flex;
    gap: ${spacingsPx.xs};
    background: ${({ theme, variant }) => getBackgroundColor(variant, theme)};
    color: ${({ theme, variant }) => getForegroundColor(variant, theme)};
    padding: ${spacingsPx.xs} ${spacingsPx.sm};
    ${typography.highlight}
    border-radius: ${borders.radii.sm};
    margin: ${spacingsPx.xs};
    align-items: center;

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        flex-direction: column;
    }
`;

const IconWrapper = styled.div`
    margin: auto ${spacingsPx.xxs};

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        display: none;
    }
`;

const BlankLeft = styled.div`
    @media (min-width: ${variables.SCREEN_SIZE.XL}) {
        flex: 1;
    }
`;

const Body = styled.div`
    display: flex;
    gap: ${spacingsPx.xs};
    width: 100%;
    position: relative;
    justify-content: left;

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        text-align: center;
    }

    @media (min-width: ${variables.SCREEN_SIZE.XL}) {
        flex: 6;
        justify-content: center;
    }
`;

const ActionsWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    right: ${spacingsPx.sm};

    @media screen and (max-width: ${variables.SCREEN_SIZE.XL}) {
        position: relative;
        right: auto;
    }

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding-left: ${spacingsPx.lg};
        padding-right: ${spacingsPx.lg};
    }

    @media (min-width: ${variables.SCREEN_SIZE.XL}) {
        flex: 1;
    }
`;

const CancelWrapper = styled.div`
    margin-left: ${spacingsPx.xs};
`;

export const Banner = ({ body, variant, action, dismissal, className }: BannerProps) => {
    const theme = useTheme();

    const iconElement = getIcon(variant, theme);
    return (
        <Wrapper variant={variant} className={className}>
            <BlankLeft />
            <Body>
                {iconElement && <IconWrapper>{iconElement}</IconWrapper>}
                {body}
            </Body>
            <ActionsWrapper>
                {action && (
                    <Button
                        size="tiny"
                        variant="tertiary"
                        onClick={action.onClick}
                        data-test={action['data-test']}
                    >
                        {action.label}
                    </Button>
                )}
                {dismissal && (
                    <CancelWrapper>
                        <Icon
                            size={20}
                            icon="CROSS"
                            color={getForegroundColor(variant, theme)}
                            onClick={dismissal.onClick}
                            data-test={dismissal['data-test']}
                        />
                    </CancelWrapper>
                )}
            </ActionsWrapper>
        </Wrapper>
    );
};
