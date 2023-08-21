import React from 'react';

import { Screen, ScreenHeader } from '@suite-native/navigation';
import { VStack, Card, Text, Button, HStack, Pictogram } from '@suite-native/atoms';
import { useOpenLink } from '@suite-native/link';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { FAQInfoPanel } from '../components/FAQInfoPanel';

const supportCardStyle = prepareNativeStyle(utils => ({
    padding: utils.spacings.extraLarge,
}));

const SupportCard = () => {
    const { applyStyle } = useNativeStyles();
    const openLink = useOpenLink();

    const handleOpenSupportLink = () => openLink('https://trezor.io/learn/c/trezor-suite-lite');

    return (
        <Card style={applyStyle(supportCardStyle)}>
            <HStack justifyContent="space-between">
                <VStack spacing="medium" alignItems="flex-start" paddingTop="small">
                    <Text variant="titleSmall">Need more help?</Text>
                    <Button size="small" onPress={handleOpenSupportLink}>
                        Contact support
                    </Button>
                </VStack>
                <Pictogram variant="green" size="small" icon="lifebuoy" />
            </HStack>
        </Card>
    );
};

export const SettingsFAQScreen = () => (
    <Screen header={<ScreenHeader content="Get help" />}>
        <VStack spacing="large">
            <FAQInfoPanel />
            <SupportCard />
        </VStack>
    </Screen>
);
