import React from 'react';

import { Screen, ScreenHeader } from '@suite-native/navigation';
import { VStack, Card, Text, Button, handleRedirect } from '@suite-native/atoms';

import { FAQInfoPanel } from '../components/FAQInfoPanel';

export const SettingsFAQScreen = () => (
    <Screen header={<ScreenHeader title="Get help" />}>
        <VStack spacing="large">
            <FAQInfoPanel />
            <Card>
                <VStack spacing="medium">
                    <Text numberOfLines={3} variant="titleSmall">
                        Need more help?
                    </Text>
                    <Button onPress={() => handleRedirect('https://trezor.io/support')}>
                        Contact support
                    </Button>
                </VStack>
            </Card>
        </VStack>
    </Screen>
);
