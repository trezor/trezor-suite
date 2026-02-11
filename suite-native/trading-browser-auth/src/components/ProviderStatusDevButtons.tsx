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
                <Text variant="callout">Current status:</Text>
                <Text variant="callout" color="textSubdued">
                    {currentStatus}
                </Text>
            </HStack>
            <HStack justifyContent="center" spacing="sp4">
                <Button
                    colorScheme="redElevation0"
                    size="tiny"
                    onPress={() => {
                        dispatchHelper('window_closed_incomplete');
                    }}
                >
                    incomplete
                </Button>
                <Button
                    colorScheme="blueElevation0"
                    size="tiny"
                    onPress={() => {
                        dispatchHelper('window_closed_with_success');
                    }}
                >
                    with_success
                </Button>
                <Button
                    colorScheme="redBold"
                    size="tiny"
                    onPress={() => {
                        dispatchHelper('confirmation_failed');
                    }}
                >
                    failed
                </Button>
                <Button
                    size="tiny"
                    onPress={() => {
                        dispatchHelper('confirmation_success');
                    }}
                >
                    success
                </Button>
            </HStack>
            <HStack justifyContent="center">
                <Button
                    colorScheme="yellowElevation0"
                    size="tiny"
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
