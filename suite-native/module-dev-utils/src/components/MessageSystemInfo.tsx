import { useSelector } from 'react-redux';

import { A } from '@mobily/ts-belt';

import { selectAllValidMessages, selectMessageSystemConfig } from '@suite-common/message-system';
import { Button, Card, TitleHeader, Text, Divider, VStack, Box } from '@suite-native/atoms';
import { useCopyToClipboard } from '@suite-native/helpers';

export const MessageSystemInfo = () => {
    const config = useSelector(selectMessageSystemConfig);
    const allValidMessages = useSelector(selectAllValidMessages);
    const copyToClipboard = useCopyToClipboard();

    const handleCopyConfig = () => {
        copyToClipboard(config !== null ? JSON.stringify(config) : 'no config');
    };

    return (
        <Card>
            <VStack paddingTop="medium">
                <Text variant="highlight">Message system</Text>
                <VStack spacing="small" paddingBottom="medium">
                    <Text variant="label">Sequence: {config?.sequence}</Text>
                    <Text variant="label">Timestamp: {config?.timestamp}</Text>
                    <Button
                        colorScheme="tertiaryElevation0"
                        size="small"
                        onPress={handleCopyConfig}
                    >
                        Copy full config
                    </Button>
                </VStack>
                <Text variant="highlight">Valid messages:</Text>
                <VStack spacing="small">
                    {allValidMessages.map(m => (
                        <Box key={m.id}>
                            <Text variant="label">{m.id}</Text>
                            <Text variant="hint">{m.content.en}</Text>
                            <Divider />
                        </Box>
                    ))}
                </VStack>
                {A.isEmpty(allValidMessages) && <Text variant="callout">No valid message</Text>}
            </VStack>
        </Card>
    );
};
