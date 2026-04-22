import { useSelector } from 'react-redux';

import { Button, HStack, Text, VStack } from '@suite-native/atoms';
import { DebugModeView } from '@suite-native/trading-debug';
import { selectTradingProviderConfirmationStatus } from '@suite-native/trading-state';

import { useDispatchProviderConfirmationStatus } from '../hooks/useDispatchProviderConfirmationStatus';

const ProviderStatusDevButtonsContent = () => {
    const dispatchHelper = useDispatchProviderConfirmationStatus();
    const currentStatus = useSelector(selectTradingProviderConfirmationStatus);

    return (
        <VStack spacing="sp4" flex={1}>
            <HStack>
                <Text variant="body-sm-strong">Current status:</Text>
                <Text variant="body-sm-strong" color="contentSecondary">
                    {currentStatus}
                </Text>
            </HStack>
            <HStack justifyContent="center" spacing="sp4">
                <Button
                    intent="critical"
                    priority="secondary"
                    size="small"
                    onPress={() => {
                        dispatchHelper('window_closed_incomplete');
                    }}
                >
                    incomplete
                </Button>
                <Button
                    intent="info"
                    priority="secondary"
                    size="small"
                    onPress={() => {
                        dispatchHelper('window_closed_with_success');
                    }}
                >
                    with_success
                </Button>
            </HStack>
            <HStack justifyContent="center">
                <Button
                    intent="critical"
                    priority="primary"
                    size="small"
                    onPress={() => {
                        dispatchHelper('confirmation_failed');
                    }}
                >
                    failed
                </Button>
                <Button
                    size="small"
                    onPress={() => {
                        dispatchHelper('confirmation_success');
                    }}
                >
                    success
                </Button>
                <Button
                    intent="warning"
                    priority="secondary"
                    size="small"
                    onPress={() => {
                        dispatchHelper('inactive');
                        dispatchHelper('window_opened');
                    }}
                >
                    restart flow
                </Button>
            </HStack>
        </VStack>
    );
};

export const ProviderStatusDevButtons = () => (
    <DebugModeView>
        <ProviderStatusDevButtonsContent />
    </DebugModeView>
);
