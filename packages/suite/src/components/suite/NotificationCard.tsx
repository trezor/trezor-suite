import { ReactNode } from 'react';
import styled from 'styled-components';
import { darken } from 'polished';

import {
    Icon,
    Button,
    Spinner,
    useTheme,
    SuiteThemeColors,
    variables,
    ButtonProps,
} from '@trezor/components';

// TODO: move to components

interface NotificationCardProps {
    children: ReactNode;
    variant: 'loader' | 'info' | 'warning' | 'critical';
    button?: ButtonProps;
    className?: string;
    ['data-test']?: string;
}

const getMainColor = (variant: NotificationCardProps['variant'], theme: SuiteThemeColors) => {
    switch (variant) {
        case 'info':
            return theme.TYPE_DARK_ORANGE;
        case 'warning':
            return theme.TYPE_DARK_ORANGE;
        case 'critical':
            return theme.BUTTON_RED;
        default:
            return 'transparent';
    }
};

const getHoverColor = (variant: NotificationCardProps['variant'], theme: SuiteThemeColors) => {
    // design guidelines missing
    switch (variant) {
        case 'info':
            return darken(theme.HOVER_DARKEN_FILTER, theme.TYPE_DARK_ORANGE);
        case 'warning':
            return darken(theme.HOVER_DARKEN_FILTER, theme.TYPE_DARK_ORANGE);
        case 'critical':
            return theme.BUTTON_RED_HOVER;
        default:
            return 'transparent';
    }
};

const getIcon = (variant: NotificationCardProps['variant'], theme: SuiteThemeColors) => {
    switch (variant) {
        case 'loader':
            return <Spinner size={22} />;
        default:
            return <Icon icon="WARNING" size={22} color={getMainColor(variant, theme)} />;
    }
};

const Wrapper = styled.div`
    display: flex;
    border-radius: 8px;
    padding: 14px 18px;
    align-items: center;
    background: ${({ theme }) => theme.STROKE_GREY};
    margin-bottom: 8px;
`;

const IconWrapper = styled.div`
    margin-right: 14px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        display: none;
    }
`;

const Body = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const NotificationButton = styled(Button)<{
    notificationVariant: NotificationCardProps['variant'];
}>`
    margin-left: 16px;
    color: ${({ theme }) => theme.TYPE_WHITE};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    font-size: ${variables.FONT_SIZE.SMALL};
    background: ${({ notificationVariant, theme }) => getMainColor(notificationVariant, theme)};
    height: 30px;

    &:hover,
    &:focus,
    &:active {
        color: ${({ theme }) => theme.TYPE_WHITE};
        background: ${({ notificationVariant, theme }) =>
            getHoverColor(notificationVariant, theme)};
    }
`;

export const NotificationCard = ({
    variant,
    button,
    children,
    className,
    ...props
}: NotificationCardProps) => {
    const theme = useTheme();
    const iconElement = getIcon(variant, theme);
    return (
        <Wrapper className={className} data-test={props['data-test']}>
            {iconElement && <IconWrapper>{iconElement}</IconWrapper>}
            <Body>{children}</Body>
            {button && (
                <NotificationButton variant="primary" notificationVariant={variant} {...button} />
            )}
        </Wrapper>
    );
};
