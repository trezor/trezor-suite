import type { NotificationEntry } from '@suite-common/toast-notifications';
import { Button, Icon, ButtonProps, Paragraph, IconName, Row, Column } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation, FormattedDateWithBullet } from 'src/components/suite';
import { getNotificationIcon } from 'src/utils/suite/notification';
import { useLayoutSize } from 'src/hooks/suite';
import type { ExtendedMessageDescriptor, ToastNotificationVariant } from 'src/types/suite';

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
        variant?: ButtonProps['variant'];
    };
}

export const NotificationView = ({
    message,
    messageValues,
    action,
    icon,
    variant,
    notification: { seen, id },
}: NotificationViewProps) => {
    const { isMobileLayout } = useLayoutSize();
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
                (isMobileLayout ? (
                    <Icon name="caretRight" onClick={action.onClick} size={18} />
                ) : (
                    <Button variant="tertiary" size="tiny" onClick={action.onClick} minWidth={80}>
                        <Translation id={action.label} />
                    </Button>
                ))}
        </Row>
    );
};
