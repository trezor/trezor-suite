import React from 'react';

import { Screen, ScreenHeader } from '@suite-native/navigation';
import { VStack, Card, Text, Button } from '@suite-native/atoms';
import { useOpenLink } from '@suite-native/link';

import { FAQInfoPanel } from '../components/FAQInfoPanel';

export const SettingsFAQScreen = () => {
    const openLink = useOpenLink();
    return (
        <Screen header={<ScreenHeader content="Get help" />}>
            <VStack spacing="large">
                <FAQInfoPanel />
                <Card>
                    <VStack spacing="medium">
                        <Text numberOfLines={3} variant="titleSmall">
                            Need more help?
                        </Text>
                        <Button
                            onPress={() => openLink('https://trezor.io/learn/c/trezor-suite-lite')}
                        >
                            Contact support
                        </Button>
                    </VStack>
                </Card>
            </VStack>
        </Screen>
    );
};
