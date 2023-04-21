import React from 'react';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AlertBox, Toggle, VStack } from '@suite-native/atoms';

type IncludeTokensToggleProps = {
    isToggled: boolean;
    onToggle: () => void;
};

export const IncludeTokensToggle = ({ isToggled, onToggle }: IncludeTokensToggleProps) => (
    <VStack marginHorizontal="small">
        <Toggle
            leftLabel="Ethereum"
            rightLabel="Include tokens"
            isToggled={isToggled}
            onToggle={onToggle}
        />
        {isToggled && (
            <Animated.View entering={FadeIn}>
                <AlertBox
                    title="Note, your Ethereum balance doesn’t include tokens. Your token balance is reflected in My portfolio balance."
                    isIconVisible={false}
                />
            </Animated.View>
        )}
    </VStack>
);
