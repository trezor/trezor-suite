import React from 'react';
import styled from 'styled-components';
import { Button, Icon, variables, colors } from '@trezor/components';
import { Translation } from '@suite-components';
import * as notificationActions from '@suite-actions/notificationActions';
import { useActions } from '@suite-hooks';
import { ViewProps } from '@suite-components/hocNotification';

const getVariantColor = (variant: ViewProps['variant']) => {
    switch (variant) {
        case 'info':
            return 'transparent';
        case 'warning':
            return colors.NEUE_TYPE_ORANGE;
        case 'error':
            return colors.NEUE_TYPE_RED;
        case 'success':
            return colors.NEUE_TYPE_GREEN;
        default:
            return 'transparent';
    }
};

const getIcon = (variant: ViewProps['variant']) => {
    switch (variant) {
        case 'info':
            return 'INFO';
        case 'warning':
            return 'WARNING_ACTIVE';
        case 'error':
            return 'WARNING_ACTIVE';
        case 'success':
            return 'CHECK';
        // no default
    }
};

const Wrapper = styled.div<Pick<ViewProps, 'variant'>>`
    display: flex;
    align-items: center;
    font-size: ${variables.FONT_SIZE.SMALL};
    height: 100%;
    padding: 6px 12px;
    align-items: center;
    border-left: 4px solid ${props => getVariantColor(props.variant)};
`;

const Title = styled.span`
    margin-left: 10px;
    flex: 1;
    font-weight: 500;
    color: ${colors.NEUE_TYPE_DARK_GREY};
`;

const StyledButton = styled(Button)`
    margin-left: 10px;
`;

const CancelWrapper = styled.div`
    margin-left: 10px;
    margin-top: 6px;
    align-self: flex-start;
`;

const ToastNotification = ({
    icon,
    message,
    action,
    actionLabel,
    cancelable = true,
    ...props
}: ViewProps) => {
    const defaultIcon = icon ?? getIcon(props.variant);
    const { closeNotification } = useActions({
        closeNotification: notificationActions.close,
    });

    return (
        <Wrapper data-test="@toast" variant={props.variant}>
            {defaultIcon && (
                <Icon icon={defaultIcon} size={20} color={getVariantColor(props.variant)} />
            )}
            <Title>
                <Translation {...message} />
            </Title>
            {action && actionLabel && (
                <StyledButton
                    variant="tertiary"
                    icon="ARROW_RIGHT"
                    alignIcon="right"
                    onClick={action}
                >
                    <Translation {...actionLabel} />
                </StyledButton>
            )}
            {cancelable && (
                <CancelWrapper>
                    <Icon
                        size={16}
                        icon="CROSS"
                        onClick={() => {
                            closeNotification(props.notification.id);
                        }}
                    />
                </CancelWrapper>
            )}
        </Wrapper>
    );
};

export default ToastNotification;
