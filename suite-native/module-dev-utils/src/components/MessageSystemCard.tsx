import { useSelector } from 'react-redux';

import { A } from '@mobily/ts-belt';

import {
    CONFIG_URL_REMOTE,
    selectAllValidMessages,
    selectMessageSystemConfig,
} from '@suite-common/message-system';
import { Button, Card, Divider, Text, VStack } from '@suite-native/atoms';
import { useCopyToClipboard } from '@suite-native/clipboard';
import { isCodesignBuild } from '@trezor/env-utils';

import { MessageSystemConfigSourceSelect } from './MessageSystemConfigSourceSelect';

export const MessageSystemCard = () => {
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
            <VStack spacing="sp12">
                <Text variant="headline-sm">Message system</Text>
                <MessageSystemConfigSourceSelect />
                <VStack spacing="sp8" paddingBottom="sp16">
                    <Text variant="body-xs">Codesign Build: {isCodesigned.toString()}</Text>
                    <Text variant="body-xs">ConfigUrl: {remoteConfigUrl}</Text>
                    <Text variant="body-xs">Sequence: {config?.sequence}</Text>
                    <Text variant="body-xs">Timestamp: {config?.timestamp}</Text>
                    <Button
                        intent="neutral"
                        priority="secondary"
                        size="medium"
                        onPress={handleCopyConfig}
                    >
                        Copy full config
                    </Button>
                </VStack>
                <Text variant="body-md-strong">Valid messages:</Text>
                <VStack spacing="sp8">
                    <Divider />
                    {allValidMessages.map(m => (
                        <VStack key={m.id}>
                            <Text variant="body-xs">{m.id}</Text>
                            <Text variant="body-sm">{m.content.en}</Text>
                            <Divider />
                        </VStack>
                    ))}
                </VStack>
                {A.isEmpty(allValidMessages) && (
                    <Text variant="body-sm-strong">No valid message</Text>
                )}
            </VStack>
        </Card>
    );
};
