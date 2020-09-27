import React from 'react';
import styled from 'styled-components';
import Card from '@suite-components/Card';
import { Icon, Button, Loader, colors, ButtonProps, variables } from '@trezor/components';

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
            return '#9B6A00';
        case 'warning':
            return '#9B6A00';
        case 'error':
            return '#A72323';
        default:
            return 'transparent';
    }
};

const getIcon = (variant: Props['variant']) => {
    switch (variant) {
        case 'loader':
            return <Loader size={22} transparentRoute />;
        default:
            return <Icon icon="WARNING_ACTIVE" size={22} color={getMainColor(variant)} />;
    }
};

const Wrapper = styled(Card)<{ variant: Props['variant'] }>`
    margin: 8px 0;
    padding: 14px 18px 14px 18px;
    align-items: center;
    background: ${colors.NEUE_STROKE_GREY};
`;

const IconWrapper = styled.div`
    margin-right: 14px;
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

type NotificationButtonProps = { notificationVariant: Props['variant'] } & ButtonProps;
const NotificationButton = styled(
    ({ notificationVariant, ...buttonProps }: NotificationButtonProps) => (
        // prevent passing notificationVariant to Button component
        <Button {...buttonProps} />
    ),
)`
    margin-left: 16px;

    color: ${colors.WHITE};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    font-size: ${variables.FONT_SIZE.SMALL};
    background: ${props => getMainColor(props.notificationVariant)};

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
    ['data-test']?: string;
}

const NotificationCard = ({ variant, button, children, ...props }: Props) => {
    const iconElement = getIcon(variant);
    return (
        <Wrapper variant={variant} data-test={props['data-test']}>
            {iconElement && <IconWrapper>{iconElement}</IconWrapper>}
            <Body>{children}</Body>
            {button && (
                <NotificationButton variant="primary" notificationVariant={variant} {...button} />
            )}
        </Wrapper>
    );
};

export default NotificationCard;
