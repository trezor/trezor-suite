import { toCommaSeparated } from '@suite-common/message-system';
import { type Message } from '@suite-common/suite-types';
import { Column, Icon, InfoItem } from '@trezor/components';
import {
    CircleFilledIcon,
    CloudIcon,
    FireIcon,
    InfoIcon,
    WarningIcon,
    XCircleIcon,
} from '@trezor/icons';
type MessageSystemManagerInfoProps = {
    message: Message;
    allValidMessages: Message[];
    isInApp: boolean;
};

export const MessageSystemManagerInfo = ({
    message,
    allValidMessages,
    isInApp,
}: MessageSystemManagerInfoProps) => (
    <Column gap={8}>
        <InfoItem label="Active" icon={InfoIcon} direction="row">
            <Icon
                as={CircleFilledIcon}
                intent={
                    allValidMessages.some(validMessage => validMessage.id === message.id)
                        ? 'brand'
                        : 'critical'
                }
            />
        </InfoItem>
        <InfoItem label="Source" icon={CloudIcon} direction="row">
            {isInApp ? 'in-app' : 'file'}
        </InfoItem>
        <InfoItem label="Category" icon={InfoIcon} direction="row">
            {toCommaSeparated(message.category)}
        </InfoItem>
        <InfoItem label="Variant" icon={WarningIcon} direction="row">
            {message.variant}
        </InfoItem>
        <InfoItem label="Dismissible" icon={XCircleIcon} direction="row">
            {message.dismissible ? 'true' : 'false'}
        </InfoItem>
        <InfoItem label="Priority" icon={FireIcon} direction="row">
            {message.priority}
        </InfoItem>
    </Column>
);
