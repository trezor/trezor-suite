import React from 'react';
import styled from 'styled-components';
import { Icon, Button, Loader, colors, variables, ButtonProps } from '@trezor/components';

// TODO: move to components

const getMainColor = (variant: Props['variant']) => {
    switch (variant) {
        case 'info':
            return colors.NEUE_TYPE_ORANGE;
        case 'warning':
            return colors.NEUE_TYPE_ORANGE;
        case 'error':
            return colors.NEUE_TYPE_RED;
        default:
            return 'transparent';
    }
};

const getHoverColor = (variant: Props['variant']) => {
    // design guidelines missing
    switch (variant) {
        case 'info':
            return '#B3870D';
        case 'warning':
            return '#B3870D';
        case 'error':
            return 'BF4848';
        default:
            return 'transparent';
    }
};

const getIcon = (variant: Props['variant']) => {
    switch (variant) {
        case 'loader':
            return <Loader size={22} />;
        default:
            return <Icon icon="WARNING_ACTIVE" size={22} color={getMainColor(variant)} />;
    }
};

const Wrapper = styled.div`
    display: flex;
    border-radius: 6px;
    padding: 14px 18px 14px 18px;
    align-items: center;
    background: ${colors.NEUE_STROKE_GREY};
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
    color: ${colors.NEUE_TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const NotificationButton = styled(Button)<{ notificationVariant: Props['variant'] }>`
    margin-left: 16px;
    color: ${colors.WHITE};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    font-size: ${variables.FONT_SIZE.SMALL};
    background: ${props => getMainColor(props.notificationVariant)};
    height: 30px;

    &:hover,
    &:focus,
    &:active {
        background: ${props => getHoverColor(props.notificationVariant)};
    }
`;

interface Props {
    children: React.ReactNode;
    variant: 'loader' | 'info' | 'warning' | 'error';
    button?: ButtonProps;
    className?: string;
    ['data-test']?: string;
}

const NotificationCard = ({ variant, button, children, className, ...props }: Props) => {
    const iconElement = getIcon(variant);
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

export default NotificationCard;
