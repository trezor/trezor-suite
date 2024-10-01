import { useSelector } from 'react-redux';

import { A } from '@mobily/ts-belt';

import {
    CONFIG_URL_REMOTE,
    selectAllValidMessages,
    selectMessageSystemConfig,
} from '@suite-common/message-system';
import { Button, Card, Text, Divider, VStack } from '@suite-native/atoms';
import { useCopyToClipboard } from '@suite-native/helpers';
import { isCodesignBuild } from '@trezor/env-utils';

export const MessageSystemInfo = () => {
    const config = useSelector(selectMessageSystemConfig);
    const allValidMessages = useSelector(selectAllValidMessages);
    const copyToClipboard = useCopyToClipboard();
    const isCodesigned = isCodesignBuild();
    const remoteConfigUrl = isCodesigned ? CONFIG_URL_REMOTE.stable : CONFIG_URL_REMOTE.develop;

    const handleCopyConfig = () => {
        copyToClipboard(config !== null ? JSON.stringify(config) : 'no config');
    };

    return (
        <Card>
            <VStack paddingTop="sp16">
                <Text variant="highlight">Message system</Text>
                <VStack spacing="sp8" paddingBottom="sp16">
                    <Text variant="label">Codesign Build: {isCodesigned.toString()}</Text>
                    <Text variant="label">ConfigUrl: {remoteConfigUrl}</Text>
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
                <VStack spacing="sp8">
                    <Divider />
                    {allValidMessages.map(m => (
                        <VStack key={m.id}>
                            <Text variant="label">{m.id}</Text>
                            <Text variant="hint">{m.content.en}</Text>
                            <Divider />
                        </VStack>
                    ))}
                </VStack>
                {A.isEmpty(allValidMessages) && <Text variant="callout">No valid message</Text>}
            </VStack>
        </Card>
    );
};
