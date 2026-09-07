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
                    intent="debug"
                    priority="secondary"
                    size="medium"
                    onPress={() => {
                        dispatchHelper('window_closed_incomplete');
                    }}
                >
                    incomplete
                </Button>
                <Button
                    intent="debug"
                    priority="secondary"
                    size="medium"
                    onPress={() => {
                        dispatchHelper('window_closed_with_success');
                    }}
                >
                    with_success
                </Button>
            </HStack>
            <HStack justifyContent="center">
                <Button
                    intent="debug"
                    priority="primary"
                    size="medium"
                    onPress={() => {
                        dispatchHelper('confirmation_failed');
                    }}
                >
                    failed
                </Button>
                <Button
                    intent="debug"
                    size="medium"
                    onPress={() => {
                        dispatchHelper('confirmation_success');
                    }}
                >
                    success
                </Button>
                <Button
                    intent="debug"
                    priority="secondary"
                    size="medium"
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
