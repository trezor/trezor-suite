import { useState } from 'react';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Box, Button, Card, CheckBox, HStack, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const flexFillStyle = prepareNativeStyle(() => ({
    flex: 1,
}));

type DisclaimerScreenContentProps = {
    onContinue: () => void;
};

export const DisclaimerScreenContent = ({ onContinue }: DisclaimerScreenContentProps) => {
    const { applyStyle } = useNativeStyles();
    const [isChecked, setIsChecked] = useState(false);

    return (
        <VStack flex={1} justifyContent="space-between">
            <VStack spacing="sp24">
                <VStack spacing="sp4">
                    <Text variant="body-sm-strong" color="contentBrand" textAlign="center">
                        <Translation id="moduleCreateAdditionalBackup.disclaimerScreen.label" />
                    </Text>
                    <Text variant="headline-md" textAlign="center">
                        <Translation id="moduleCreateAdditionalBackup.disclaimerScreen.title" />
                    </Text>
                </VStack>

                <VStack spacing="sp16">
                    <VStack spacing="sp4">
                        <Text variant="body-md-strong">
                            <Translation id="moduleCreateAdditionalBackup.disclaimerScreen.howItWorks.title" />
                        </Text>
                        <Text variant="body-sm" color="contentSecondary">
                            <Translation id="moduleCreateAdditionalBackup.disclaimerScreen.howItWorks.description" />
                        </Text>
                    </VStack>
                    <VStack spacing="sp4">
                        <Text variant="body-md-strong">
                            <Translation id="moduleCreateAdditionalBackup.disclaimerScreen.currentBackup.title" />
                        </Text>
                        <Text variant="body-sm" color="contentSecondary">
                            <Translation id="moduleCreateAdditionalBackup.disclaimerScreen.currentBackup.description" />
                        </Text>
                    </VStack>
                </VStack>

                <Card>
                    <HStack spacing="sp12" alignItems="center">
                        <Text style={applyStyle(flexFillStyle)}>
                            <Translation id="moduleCreateAdditionalBackup.disclaimerScreen.checkbox" />
                        </Text>
                        <CheckBox
                            isChecked={isChecked}
                            onChange={() => setIsChecked(prev => !prev)}
                            testID="@create-additional-backup/disclaimer-checkbox"
                        />
                    </HStack>
                </Card>
            </VStack>

            {isChecked && (
                <Animated.View entering={FadeIn} exiting={FadeOut}>
                    <Box>
                        <Button
                            onPress={onContinue}
                            isFullWidth
                            testID="@create-additional-backup/disclaimer-continue"
                        >
                            <Translation id="generic.buttons.continue" />
                        </Button>
                    </Box>
                </Animated.View>
            )}
        </VStack>
    );
};
