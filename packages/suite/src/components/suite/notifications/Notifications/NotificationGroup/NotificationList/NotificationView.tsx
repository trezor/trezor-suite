import { type ReactNode } from 'react';

import { type ExtendedMessageDescriptor, Translation } from '@suite/intl';
import type { NotificationEntry } from '@suite-common/toast-notifications';
import {
    Button,
    type ButtonProps,
    Column,
    Icon,
    type IconComponent,
    Paragraph,
    Row,
} from '@trezor/components';
import { type ButtonPriority } from '@trezor/components/src/components/buttons/types';
import { CaretRightIcon } from '@trezor/icons';

import { FormattedDateWithBullet } from 'src/components/suite/FormattedDateWithBullet';
import { useLayoutSize } from 'src/hooks/suite';
import type { ToastNotificationVariant } from 'src/types/suite';
import { getNotificationIcon } from 'src/utils/suite/notification';

export interface NotificationAction {
    onClick: () => void;
    label: ExtendedMessageDescriptor['id'];
    position?: 'bottom' | 'right';
    intent?: ButtonProps['intent'];
    priority?: ButtonPriority;
}

export interface NotificationViewProps {
    notification: NotificationEntry;
    variant: ToastNotificationVariant;
    icon?: IconComponent | ReactNode;
    message: ExtendedMessageDescriptor['id'];
    messageValues: ExtendedMessageDescriptor['values'];
    action?: NotificationAction | NotificationAction[];
}

export const NotificationView = ({
    message,
    messageValues,
    action: actionProp,
    icon,
    variant,
    notification: { seen, id },
}: NotificationViewProps) => {
    const { isBelowTablet } = useLayoutSize();
    const defaultIcon = icon ?? getNotificationIcon(variant);
    const isSeen = seen;
    const colorProps = isSeen
        ? { intent: 'neutral' as const, priority: 'secondary' as const }
        : { intent: 'neutral' as const };

    // NotificationView only supports a single action so even if an array is passed, only the first action is used
    const action = Array.isArray(actionProp) ? actionProp[0] : actionProp;

    return (
        <Row gap={12}>
            {defaultIcon &&
                (typeof defaultIcon === 'function' ? (
                    <Icon size={20} as={defaultIcon} {...colorProps} />
                ) : (
                    defaultIcon
                ))}
            <Column gap={4} margin={{ right: 'auto' }}>
                <Paragraph
                    typographyStyle={seen ? 'body-sm' : 'body-sm-strong'}
                    intent="neutral"
                    priority={isSeen ? 'secondary' : 'primary'}
                >
                    <Translation id={message} values={messageValues} />
                </Paragraph>
                <Paragraph
                    typographyStyle="body-xs"
                    intent="neutral"
                    priority={isSeen ? 'secondary' : 'primary'}
                >
                    <FormattedDateWithBullet value={id} />
                </Paragraph>
            </Column>
            {action?.onClick &&
                (isBelowTablet ? (
                    <Icon as={CaretRightIcon} onClick={action.onClick} size={18} />
                ) : (
                    <Button
                        intent={action.intent ?? 'neutral'}
                        priority={action.priority ?? 'secondary'}
                        size="small"
                        onClick={action.onClick}
                        minWidth={80}
                    >
                        <Translation id={action.label} />
                    </Button>
                ))}
        </Row>
    );
};
