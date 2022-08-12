import React, { useLayoutEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { Button, Icon, useTheme, variables } from '@trezor/components';
import { Translation } from '@suite-components';
import * as notificationActions from '@suite-actions/notificationActions';
import { useActions } from '@suite-hooks';
import { getNotificationIcon, getVariantColor } from '@suite-utils//notification';
import type { NotificationEntry } from '@suite-reducers/notificationReducer';
import NotificationRenderer, {
    NotificationViewProps,
} from '@suite-components/NotificationRenderer';

const Wrapper = styled.div<Pick<NotificationViewProps, 'variant'> & { isTall: boolean }>`
    display: flex;
    align-items: ${({ isTall }) => (isTall ? 'start' : 'center')};
    font-size: ${variables.FONT_SIZE.SMALL};
    height: 100%;
    padding: ${({ isTall }) => (isTall ? '16px 16px 12px 12px' : '12px 16px 12px 12px')};
    border-left: 4px solid ${({ variant }) => getVariantColor(variant)};
    word-break: break-word;
    max-width: 430px;
`;

const BodyWrapper = styled.div<{ isTall: boolean }>`
    flex: 1;
    margin-top: ${({ isTall }) => isTall && '-4px'};
    margin-left: 14px;
`;

const Message = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
`;

const StyledButton = styled(Button)<{ $action: NotificationViewProps['action'] }>`
    ${({ $action }) =>
        (!$action?.position || $action.position === 'right') &&
        css`
            margin-left: 16px;
        `};

    ${({ $action }) =>
        $action?.position === 'bottom' &&
        css`
            margin-top: 12px;
            height: 32px;
        `};
`;

const StyledCancelIcon = styled(Icon)`
    margin-left: 18px;
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
    const [isTall, setIsTall] = useState(false);

    const { closeNotification } = useActions({
        closeNotification: notificationActions.close,
    });

    const theme = useTheme();
    const wrapperRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const height = wrapperRef.current?.getBoundingClientRect().height ?? 0;

        // more than 2 lines of text
        if (height > 70) {
            setIsTall(true);
        }
    }, []);

    const dataTestBase = `@toast/${type}`;
    const defaultIcon = icon ?? getNotificationIcon(variant);

    const handleCancelClick = () => {
        closeNotification(id);
        onCancel?.();
    };

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
        <Wrapper data-test={dataTestBase} variant={variant} isTall={isTall} ref={wrapperRef}>
            {defaultIcon && typeof defaultIcon === 'string' ? (
                <Icon icon={defaultIcon} size={24} color={getVariantColor(variant)} />
            ) : (
                defaultIcon
            )}
            <BodyWrapper isTall={isTall}>
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
                    hoverColor={theme.TYPE_LIGHTER_GREY}
                    onClick={handleCancelClick}
                    data-test={`${dataTestBase}/close`}
                />
            )}
        </Wrapper>
    );
};

export const renderToast = (payload: NotificationEntry) => (
    <NotificationRenderer notification={payload} render={ToastNotification} />
);
