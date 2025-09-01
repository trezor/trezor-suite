import { toCommaSeparated } from '@suite-common/message-system';
import { Message } from '@suite-common/suite-types';
import { Column, Icon, InfoItem } from '@trezor/components';
import { spacings } from '@trezor/theme';

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
    <Column gap={spacings.xs}>
        <InfoItem label="Active" iconName="info" direction="row">
            <Icon
                name="circleFilled"
                variant={
                    allValidMessages.some(message => message.id === message.id)
                        ? 'primary'
                        : 'destructive'
                }
            />
        </InfoItem>
        <InfoItem label="Source" iconName="cloud" direction="row">
            {isInApp ? 'in-app' : 'file'}
        </InfoItem>
        <InfoItem label="Category" iconName="info" direction="row">
            {toCommaSeparated(message.category)}
        </InfoItem>
        <InfoItem label="Variant" iconName="warning" direction="row">
            {message.variant}
        </InfoItem>
        <InfoItem label="Dismissible" iconName="xCircle" direction="row">
            {message.dismissible ? 'true' : 'false'}
        </InfoItem>
        <InfoItem label="Priority" iconName="fire" direction="row">
            {message.priority}
        </InfoItem>
    </Column>
);
