import Animated, { FadeIn } from 'react-native-reanimated';

import { AlertBox, Box, Toggle, VStack } from '@suite-native/atoms';

type IncludeTokensToggleProps = {
    isToggled: boolean;
    onToggle: () => void;
};

export const IncludeTokensToggle = ({ isToggled, onToggle }: IncludeTokensToggleProps) => (
    <VStack spacing="sp24" marginTop="sp8">
        <Box marginHorizontal="sp24">
            <Toggle
                leftLabel="Ethereum"
                rightLabel="Include tokens"
                isToggled={isToggled}
                onToggle={onToggle}
            />
        </Box>
        {isToggled && (
            <Animated.View entering={FadeIn}>
                <Box marginHorizontal="sp8">
                    <AlertBox
                        variant="info"
                        title="Note, your Ethereum balance doesn’t include tokens."
                    />
                </Box>
            </Animated.View>
        )}
    </VStack>
);
