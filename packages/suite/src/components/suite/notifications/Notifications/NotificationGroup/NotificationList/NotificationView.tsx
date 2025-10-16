import { JSX } from 'react';

import type { NotificationEntry } from '@suite-common/toast-notifications';
import {
    Column,
    Icon,
    IconName,
    NewButton,
    NewButtonProps,
    Paragraph,
    Row,
} from '@trezor/components';
import { spacings } from '@trezor/theme';

import { FormattedDateWithBullet } from 'src/components/suite';
import { Translation } from 'src/components/suite/Translation';
import { useLayoutSize } from 'src/hooks/suite';
import type { ExtendedMessageDescriptor, ToastNotificationVariant } from 'src/types/suite';
import { getNotificationIcon } from 'src/utils/suite/notification';

export type NotificationActionVariant = 'primary' | 'info' | 'warning' | 'destructive' | 'tertiary';

export interface NotificationViewProps {
    notification: NotificationEntry;
    variant: ToastNotificationVariant;
    icon?: IconName | JSX.Element;
    message: ExtendedMessageDescriptor['id'];
    messageValues: ExtendedMessageDescriptor['values'];
    action?: {
        onClick: () => void;
        label: ExtendedMessageDescriptor['id'];
        position?: 'bottom' | 'right';
        variant?: NotificationActionVariant;
    };
}

export const mapActionVariantToIntent = (
    variant: NotificationActionVariant = 'tertiary',
): NewButtonProps['intent'] => {
    switch (variant) {
        case 'primary':
            return 'brand';
        case 'info':
            return 'info';
        case 'warning':
            return 'warning';
        case 'destructive':
            return 'critical';
        case 'tertiary':
        default:
            return 'neutral';
    }
};

export const NotificationView = ({
    message,
    messageValues,
    action,
    icon,
    variant,
    notification: { seen, id },
}: NotificationViewProps) => {
    const { isBelowTablet } = useLayoutSize();
    const defaultIcon = icon ?? getNotificationIcon(variant);
    const colorVariant = seen ? 'tertiary' : 'default';

    return (
        <Row gap={spacings.sm}>
            {defaultIcon &&
                (typeof defaultIcon === 'string' ? (
                    <Icon size={20} name={defaultIcon} variant={colorVariant} />
                ) : (
                    defaultIcon
                ))}
            <Column gap={spacings.xxs} margin={{ right: 'auto' }}>
                <Paragraph typographyStyle={seen ? 'hint' : 'callout'} variant={colorVariant}>
                    <Translation id={message} values={messageValues} />
                </Paragraph>
                <Paragraph typographyStyle="label" variant={colorVariant}>
                    <FormattedDateWithBullet value={id} />
                </Paragraph>
            </Column>
            {action?.onClick &&
                (isBelowTablet ? (
                    <Icon name="caretRight" onClick={action.onClick} size={18} />
                ) : (
                    <NewButton
                        intent={mapActionVariantToIntent(action.variant)}
                        size="small"
                        onClick={action.onClick}
                        minWidth={80}
                    >
                        <Translation id={action.label} />
                    </NewButton>
                ))}
        </Row>
    );
};
