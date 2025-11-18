import { useLayoutEffect, useRef, useState } from 'react';

import styled from 'styled-components';

import { NotificationEntry, notificationsActions } from '@suite-common/toast-notifications';
import { Button, Icon } from '@trezor/components';
import { spacings, typography } from '@trezor/theme';

import {
    NotificationRenderer,
    NotificationViewProps,
    mapActionVariantToIntent,
} from 'src/components/suite';
import { Translation } from 'src/components/suite/Translation';
import { useDispatch } from 'src/hooks/suite';
import { getNotificationIcon, getVariantColor } from 'src/utils/suite/notification';

import { ToastNotificationVariant } from '../../../types/suite';

const Wrapper = styled.div<{ $variant: ToastNotificationVariant; $isTall: boolean }>`
    display: flex;
    align-items: ${({ $isTall }) => ($isTall ? 'start' : 'center')};
    font-size: ${typography.hint};
    height: 100%;
    padding: ${({ $isTall }) => ($isTall ? '16px 16px 12px 12px' : '12px 16px 12px 12px')};
    border-left: 4px solid ${({ $variant }) => getVariantColor($variant)};
    overflow-wrap: anywhere;
    word-break: normal;
    max-width: 430px;
`;

const BodyWrapper = styled.div<{ $isTall: boolean }>`
    flex: 1;
    margin-top: ${({ $isTall }) => $isTall && '-4px'};
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
    const [isTall, setIsTall] = useState(false);
    const dispatch = useDispatch();
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
        dispatch(notificationsActions.close(id));
        onCancel?.();
    };

    const actionButton = action && (
        <Button
            intent={mapActionVariantToIntent(action.variant)}
            onClick={action.onClick}
            size="small"
            width={action.position === 'bottom' ? '100%' : undefined}
            margin={
                // eslint-disable-next-line no-nested-ternary
                !action.position || action.position === 'right'
                    ? { left: 16 }
                    : action.position === 'bottom'
                      ? { top: 12 }
                      : undefined
            }
        >
            <Translation id={action.label} />
        </Button>
    );

    return (
        <Wrapper
            data-testid={dataTestBase}
            data-testid-alt="@toast"
            $variant={variant}
            $isTall={isTall}
            ref={wrapperRef}
        >
            {defaultIcon && typeof defaultIcon === 'string' ? (
                <Icon name={defaultIcon} size={24} color={getVariantColor(variant)} />
            ) : (
                defaultIcon
            )}
            <BodyWrapper $isTall={isTall}>
                <Message>
                    <Translation id={message} values={messageValues} />
                </Message>

                {action?.position === 'bottom' && actionButton}
            </BodyWrapper>

            {(action?.position === 'right' || !action?.position) && actionButton}

            {cancelable && (
                <Icon
                    size={16}
                    name="x"
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
