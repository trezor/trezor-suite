import React from 'react';
import styled from 'styled-components';
import { Button, Icon, variables, colors } from '@trezor/components';
import { Translation } from '@suite-components';
import * as notificationActions from '@suite-actions/notificationActions';
import { useActions } from '@suite-hooks';
import { getNotificationIcon } from '@suite-utils//notification';
import { ViewProps } from '@suite-components/hocNotification/definitions';

const getVariantColor = (variant: ViewProps['variant']) => {
    switch (variant) {
        case 'info':
            return colors.TYPE_BLUE;
        case 'warning':
            return colors.TYPE_ORANGE;
        case 'error':
            return colors.TYPE_RED;
        case 'success':
            return colors.TYPE_GREEN;
        default:
            return 'transparent';
    }
};

const Wrapper = styled.div<Pick<ViewProps, 'variant'>>`
    display: flex;
    align-items: center;
    font-size: ${variables.FONT_SIZE.SMALL};
    height: 100%;
    padding: 6px 12px;
    border-left: 4px solid ${props => getVariantColor(props.variant)};
    word-break: break-word;
`;

const Title = styled.span`
    margin-left: 10px;
    flex: 1;
    font-weight: 500;
    color: ${props => props.theme.TYPE_DARK_GREY};
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
    const defaultIcon = icon ?? getNotificationIcon(props.variant);
    const { closeNotification } = useActions({
        closeNotification: notificationActions.close,
    });

    const dataTestBase = `@toast/${props.notification.type}`;

    return (
        <Wrapper data-test={dataTestBase} variant={props.variant}>
            {defaultIcon && (
                <Icon icon={defaultIcon} size={20} color={getVariantColor(props.variant)} />
            )}
            <Title>
                {typeof message === 'string' ? (
                    <Translation id={message} />
                ) : (
                    <Translation {...message} />
                )}
            </Title>
            {action && actionLabel && (
                <StyledButton
                    variant="tertiary"
                    icon="ARROW_RIGHT"
                    alignIcon="right"
                    onClick={action}
                >
                    <Translation id={actionLabel} />
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
                        data-test={`${dataTestBase}/close`}
                    />
                </CancelWrapper>
            )}
        </Wrapper>
    );
};

export default ToastNotification;
