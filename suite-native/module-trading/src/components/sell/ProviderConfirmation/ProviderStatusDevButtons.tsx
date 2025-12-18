import { Button, HStack, VStack } from '@suite-native/atoms';
import { DebugModeView } from '@suite-native/trading-debug';

import { useDispatchProviderConfirmationStatus } from '../../../hooks/general/providerConfirmation/useDispatchProviderConfirmationStatus';

const ProviderStatusDevButtonsContent = () => {
    const dispatchHelper = useDispatchProviderConfirmationStatus();

    return (
        <VStack spacing="sp4" alignItems="center">
            <HStack>
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
            <HStack>
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
