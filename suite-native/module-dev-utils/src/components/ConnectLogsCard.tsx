import { useDispatch, useSelector } from 'react-redux';

import { Card, CheckBox, HStack, Text, VStack } from '@suite-native/atoms';
import { selectShowConnectLogs, setShowConnectLogs } from '@suite-native/state';

export const ConnectLogsCard = () => {
    const dispatch = useDispatch();
    const showConnectLogs = useSelector(selectShowConnectLogs);

    return (
        <Card>
            <VStack spacing="sp12">
                <Text variant="headline-sm">Connect Logs</Text>
                <Text variant="body-xs" color="contentSecondary">
                    Show TrezorConnect logs in terminal. Restart the application to apply changes.
                </Text>
                <HStack justifyContent="space-between" alignItems="center">
                    <Text>Enable logging</Text>
                    <CheckBox
                        isChecked={showConnectLogs}
                        onChange={() => dispatch(setShowConnectLogs(!showConnectLogs))}
                    />
                </HStack>
            </VStack>
        </Card>
    );
};
