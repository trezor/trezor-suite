import styled from 'styled-components';
import { Translation, FormattedDateWithBullet } from 'src/components/suite';
import { getNotificationIcon } from 'src/utils/suite/notification';
import { Button, Icon, Paragraph } from '@trezor/components';
import { useLayoutSize } from 'src/hooks/suite';
import type { NotificationViewProps } from 'src/components/suite/NotificationRenderer';

const TextP = styled(Paragraph)<{ $seen?: boolean }>`
    opacity: ${props => (props.$seen ? 0.7 : 1)};
`;

const DateP = styled(TextP)`
    display: flex;
    flex-direction: column;
    font-variant-numeric: tabular-nums;
`;

const Item = styled.div`
    display: flex;
    align-items: center;
    padding: 16px 0px;

    & + & {
        border-top: 1px solid ${({ theme }) => theme.STROKE_GREY};
    }
`;

const Text = styled.div`
    flex: 1;
    padding: 0px 16px;
    white-space: break-spaces;
`;

const ActionButton = styled(Button)`
    min-width: 80px;
    align-self: center;
`;

const SeenWrapper = styled.span<{ $seen?: boolean }>`
    margin-bottom: '4px';
    opacity: ${props => (props.$seen ? 0.7 : 1)};
`;

const NotificationView = ({
    message,
    messageValues,
    action,
    icon,
    variant,
    notification: { seen, id },
}: NotificationViewProps) => {
    const { isMobileLayout } = useLayoutSize();

    const defaultIcon = icon ?? getNotificationIcon(variant);

    return (
        <Item>
            {defaultIcon && (
                <SeenWrapper $seen={seen}>
                    {typeof defaultIcon === 'string' ? (
                        <Icon size={20} icon={defaultIcon} />
                    ) : (
                        defaultIcon
                    )}
                </SeenWrapper>
            )}
            <Text>
                <TextP type={seen ? 'hint' : 'callout'} $seen={seen}>
                    <Translation id={message} values={messageValues} />
                </TextP>
                <DateP type="label" $seen={seen}>
                    <FormattedDateWithBullet value={id} />
                </DateP>
            </Text>

            {action?.onClick &&
                (isMobileLayout ? (
                    <Icon icon="ARROW_RIGHT" onClick={action.onClick} size={18} />
                ) : (
                    <ActionButton variant="tertiary" onClick={action.onClick}>
                        <Translation id={action.label} />
                    </ActionButton>
                ))}
        </Item>
    );
};

export default NotificationView;
