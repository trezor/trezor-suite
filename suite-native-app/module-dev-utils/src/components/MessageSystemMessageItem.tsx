import { toCommaSeparated } from '@suite-common/message-system';
import { type Action } from '@suite-common/suite-types';
import { Button, Card, Text, VStack } from '@suite-native/atoms';
import { useCopyToClipboard } from '@suite-native/clipboard';

type MessageSystemMessageItemProps = {
    action: Action;
    isActive: boolean;
    isManuallyAdded: boolean;
    onRemove: (id: string) => void;
};

export const MessageSystemMessageItem = ({
    action,
    isActive,
    isManuallyAdded,
    onRemove,
}: MessageSystemMessageItemProps) => {
    const copyToClipboard = useCopyToClipboard();
    const { message, conditions } = action;

    return (
        <Card>
            <VStack spacing="sp8">
                <Text variant="body-sm-strong">{message.id}</Text>
                <VStack spacing="sp2">
                    <Text variant="body-xs">Active: {isActive ? 'yes' : 'no'}</Text>
                    <Text variant="body-xs">Source: {isManuallyAdded ? 'in-app' : 'file'}</Text>
                    <Text variant="body-xs">Category: {toCommaSeparated(message.category)}</Text>
                    <Text variant="body-xs">Variant: {message.variant}</Text>
                    <Text variant="body-xs">
                        Dismissible: {message.dismissible ? 'true' : 'false'}
                    </Text>
                    <Text variant="body-xs">Priority: {message.priority}</Text>
                </VStack>
                <Text variant="body-sm">{message.content.en}</Text>
                <Text variant="body-xs">{JSON.stringify(conditions, null, 2)}</Text>
                <Button
                    intent="neutral"
                    priority="secondary"
                    size="medium"
                    onPress={() =>
                        copyToClipboard(JSON.stringify({ conditions, message }, null, 2))
                    }
                >
                    Copy
                </Button>
                {isManuallyAdded && (
                    <Button
                        intent="critical"
                        priority="secondary"
                        size="medium"
                        onPress={() => onRemove(message.id)}
                    >
                        Remove
                    </Button>
                )}
            </VStack>
        </Card>
    );
};
