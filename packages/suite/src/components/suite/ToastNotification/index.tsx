import React from 'react';
import styled, { css } from 'styled-components';
import { Button, Icon, variables } from '@trezor/components';
import { Translation } from '@suite-components';
import * as notificationActions from '@suite-actions/notificationActions';
import { useActions } from '@suite-hooks';
import { getNotificationIcon, getVariantColor } from '@suite-utils//notification';
import type { NotificationEntry } from '@suite-reducers/notificationReducer';
import NotificationRenderer, {
    NotificationViewProps,
} from '@suite-components/NotificationRenderer';

const Wrapper = styled.div<Pick<NotificationViewProps, 'variant'>>`
    display: flex;
    align-items: center;
    font-size: ${variables.FONT_SIZE.SMALL};
    height: 100%;
    padding: 6px 12px;
    border-left: 4px solid ${props => getVariantColor(props.variant)};
    word-break: break-word;
    max-width: 450px;
`;

const BodyWrapper = styled.div`
    flex: 1;
    margin-left: 10px;
`;

const Message = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${props => props.theme.TYPE_DARK_GREY};
`;

const StyledButton = styled(Button)<{ $action: NotificationViewProps['action'] }>`
    ${props =>
        (!props.$action?.position || props.$action.position === 'right') &&
        css`
            margin-left: 10px;
        `};
    ${props =>
        props.$action?.position === 'bottom' &&
        css`
            margin-top: 8px;
            font-weight: ${variables.FONT_SIZE.NORMAL};
            height: 32px;
        `};
`;

const StyledCancelIcon = styled(Icon)`
    margin-left: 10px;
`;

const ToastNotification = ({
    icon,
    message,
    messageValues,
    action,
    variant,
    cancelable = true,
    onCancel,
    notification: { type, id },
}: NotificationViewProps) => {
    const defaultIcon = icon ?? getNotificationIcon(variant);

    const { closeNotification } = useActions({
        closeNotification: notificationActions.close,
    });

    const dataTestBase = `@toast/${type}`;

    const actionButton = action && (
        <StyledButton
            variant={action.variant || 'tertiary'}
            onClick={action.onClick}
            fullWidth={action.position === 'bottom'}
            $action={action}
        >
            <Translation id={action.label} />
        </StyledButton>
    );

    return (
        <Wrapper data-test={dataTestBase} variant={variant}>
            {defaultIcon && typeof defaultIcon === 'string' ? (
                <Icon icon={defaultIcon} size={20} color={getVariantColor(variant)} />
            ) : (
                defaultIcon
            )}
            <BodyWrapper>
                <Message>
                    <Translation id={message} values={messageValues} />
                </Message>
                {action?.position === 'bottom' && actionButton}
            </BodyWrapper>
            {(action?.position === 'right' || !action?.position) && actionButton}
            {cancelable && (
                <StyledCancelIcon
                    size={16}
                    icon="CROSS"
                    onClick={() => {
                        closeNotification(id);
                        if (onCancel) {
                            onCancel();
                        }
                    }}
                    data-test={`${dataTestBase}/close`}
                />
            )}
        </Wrapper>
    );
};

export const renderToast = (payload: NotificationEntry) => (
    <NotificationRenderer notification={payload} render={ToastNotification} />
);

export default ToastNotification;
