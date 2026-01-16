import { useRef } from 'react';

import styled, { useTheme } from 'styled-components';

import { Translation } from '@suite/intl';
import { NotificationEntry, notificationsActions } from '@suite-common/toast-notifications';
import { Button, Column, Icon, Row } from '@trezor/components';
import { spacings, typography } from '@trezor/theme';

import { NotificationRenderer } from 'src/components/suite/notifications/NotificationRenderer/NotificationRenderer';
import type { NotificationViewProps } from 'src/components/suite/notifications/Notifications/NotificationGroup/NotificationList/NotificationView';
import { mapActionVariantToIntent } from 'src/components/suite/notifications/Notifications/NotificationGroup/NotificationList/NotificationView';
import { useDispatch } from 'src/hooks/suite';
import { getNotificationIcon, getVariantColor } from 'src/utils/suite/notification';

import { ToastNotificationVariant } from '../../../types/suite';
import { NotificationAction } from './Notifications/NotificationGroup/NotificationList/NotificationView';

const Wrapper = styled.div<{ $variant: ToastNotificationVariant }>`
    display: flex;
    align-items: center;
    font-size: ${typography.hint};
    height: 100%;
    padding: 8px 16px;
    border-left: 4px solid ${({ $variant }) => getVariantColor($variant)};
    overflow-wrap: anywhere;
    word-break: normal;
    max-width: 430px;
`;

const BodyWrapper = styled.div`
    flex: 1;
    margin-left: 14px;
`;

const Message = styled.div`
    font-weight: ${typography.callout};
    color: ${({ theme }) => theme.textDefault};
`;

interface ToastNotificationProps extends NotificationViewProps {
    cancelable?: boolean;
    onCancel?: () => void;
}

const ToastNotification = ({
    icon,
    message,
    messageValues,
    action,
    variant,
    cancelable = true,
    onCancel,
    notification: { type, id },
}: ToastNotificationProps) => {
    const theme = useTheme();
    const dispatch = useDispatch();
    const wrapperRef = useRef<HTMLDivElement>(null);

    const dataTestBase = `@toast/${type}`;
    const defaultIcon = icon ?? getNotificationIcon(variant);

    const handleCancelClick = () => {
        dispatch(notificationsActions.close(id));
        onCancel?.();
    };

    const actions = Array.isArray(action)
        ? action
        : [action].filter((a): a is NotificationAction => a !== undefined);

    const renderActionButton = (a: NotificationAction) => (
        <Button
            key={a.label}
            intent={mapActionVariantToIntent(a.variant)}
            priority={a.priority}
            onClick={a.onClick}
            size="small"
            margin={
                // eslint-disable-next-line no-nested-ternary
                !a.position || a.position === 'right'
                    ? { left: 16 }
                    : a.position === 'bottom'
                      ? { top: 12 }
                      : undefined
            }
        >
            <Translation id={a.label} />
        </Button>
    );

    return (
        <Wrapper
            data-testid={dataTestBase}
            data-testid-alt="@toast"
            $variant={variant}
            ref={wrapperRef}
        >
            {defaultIcon && typeof defaultIcon === 'string' ? (
                <Icon name={defaultIcon} size={24} color={getVariantColor(variant)} />
            ) : (
                defaultIcon
            )}
            <BodyWrapper>
                <Message>
                    <Translation id={message} values={messageValues} />
                </Message>

                <Row gap={spacings.xs}>
                    {actions.map(a => a.position === 'bottom' && renderActionButton(a))}
                </Row>
            </BodyWrapper>

            <Column gap={spacings.xs}>
                {actions.map(a => (a.position === 'right' || !a.position) && renderActionButton(a))}
            </Column>

            {cancelable && (
                <Icon
                    size={20}
                    name="x"
                    hoverColor={theme.iconSubdued}
                    onClick={handleCancelClick}
                    data-testid={`${dataTestBase}/close`}
                    margin={{ left: spacings.md }}
                />
            )}
        </Wrapper>
    );
};

export const renderToast = (payload: NotificationEntry) => (
    <NotificationRenderer notification={payload} render={ToastNotification} />
);
