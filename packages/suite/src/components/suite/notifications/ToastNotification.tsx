import { toast } from 'react-toastify';

import styled from 'styled-components';

import { NotificationEntry } from '@suite-common/toast-notifications';
import { Button, Icon, IconButton, Paragraph, Row } from '@trezor/components';
import { borders, spacings } from '@trezor/theme';

import { NotificationRenderer, NotificationViewProps, Translation } from 'src/components/suite';
import { getNotificationIcon, getVariantColor } from 'src/utils/suite/notification';

import { ToastNotificationVariant } from '../../../types/suite';

const Wrapper = styled.div<{ $variant: ToastNotificationVariant }>`
    width: 100%;
    height: 100%;
    overflow-wrap: anywhere;
    word-break: normal;
    background: ${({ theme }) => theme.baseFillSurfaceModelessBrand};
    border: ${borders.widths.small} solid ${({ theme }) => theme.baseBorderSurfaceModelessBrand};
    border-radius: ${borders.radii.md};
`;

interface ToastNotificationProps extends NotificationViewProps {
    onCancel?: () => void;
}

const ToastNotification = ({
    icon,
    message,
    messageValues,
    action,
    variant,
    onCancel,
    notification: { type, id },
}: ToastNotificationProps) => {
    const dataTestBase = `@toast/${type}`;
    const defaultIcon = icon ?? getNotificationIcon(variant);

    const handleCancelClick = () => {
        toast.dismiss(id);
        onCancel?.();
    };

    const actionButton = action && (
        <Button
            variant={action.variant || 'tertiary'}
            onClick={action.onClick}
            isFullWidth={action.position === 'bottom'}
            size="tiny"
        >
            <Translation id={action.label} />
        </Button>
    );

    return (
        <Wrapper data-testid={dataTestBase} data-testid-alt="@toast" $variant={variant}>
            <Row gap={spacings.md} padding={spacings.sm}>
                {defaultIcon && typeof defaultIcon === 'string' ? (
                    <Icon name={defaultIcon} size={24} color={getVariantColor(variant)} />
                ) : (
                    defaultIcon
                )}

                <Paragraph typographyStyle="body" variant="primary" flex="1">
                    <Translation id={message} values={messageValues} />
                </Paragraph>

                <Row gap={spacings.xs}>
                    {actionButton}
                    <IconButton
                        icon="x"
                        isSubtle
                        size="small"
                        onClick={handleCancelClick}
                        data-testid={`${dataTestBase}/close`}
                    />
                </Row>
            </Row>
        </Wrapper>
    );
};

export const renderToast = (payload: NotificationEntry) => (
    <NotificationRenderer notification={payload} render={ToastNotification} />
);
