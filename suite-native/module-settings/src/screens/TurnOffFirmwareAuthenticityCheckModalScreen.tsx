import { useState } from 'react';
import { Pressable } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useDispatch } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    Button,
    Card,
    CheckBox,
    HStack,
    IconListItem,
    Text,
    TitleHeader,
    VStack,
} from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    Screen,
    ScreenHeader,
    SettingsStackParamList,
    SettingsStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { setCheckFirmwareAuthenticityEnabled } from '@suite-native/settings';
import { useToast } from '@suite-native/toasts';

const CHECKBOX_ANIMATION_DURATION = 200; // same as in useAccordionAnimation

const InformativeList = () => (
    <VStack spacing="sp24">
        <IconListItem icon="warning" variant="yellow" iconSize="large" verticalAlign="flex-start">
            <VStack spacing="sp4">
                <Text variant="highlight">
                    <Translation id="moduleSettings.deviceChecks.firmwareAuthenticityCheck.turnOffModal.item1" />
                </Text>
                <Text variant="hint" color="textSubdued">
                    <Translation id="moduleSettings.deviceChecks.firmwareAuthenticityCheck.turnOffModal.item1Explanation" />
                </Text>
            </VStack>
        </IconListItem>
        <IconListItem icon="code" variant="yellow" iconSize="large" verticalAlign="flex-start">
            <VStack spacing="sp4">
                <Text variant="highlight">
                    <Translation id="moduleSettings.deviceChecks.firmwareAuthenticityCheck.turnOffModal.item2" />
                </Text>
                <Text variant="hint" color="textSubdued">
                    <Translation id="moduleSettings.deviceChecks.firmwareAuthenticityCheck.turnOffModal.item2Explanation" />
                </Text>
            </VStack>
        </IconListItem>
    </VStack>
);

type NavigationProp = StackNavigationProps<
    SettingsStackParamList,
    SettingsStackRoutes.SettingsDeviceChecks
>;

export const TurnOffFirmwareAuthenticityCheckModalScreen = () => {
    const [isChecked, setIsChecked] = useState(false);
    const navigation = useNavigation<NavigationProp>();
    const dispatch = useDispatch();
    const { showToast } = useToast();

    const handleCheckboxPress = () => setIsChecked(prev => !prev);

    const handleButtonPress = () => {
        dispatch(setCheckFirmwareAuthenticityEnabled(false));
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.navigate(SettingsStackRoutes.SettingsDeviceChecks);
        }
        showToast({
            variant: 'default',
            message: 'Authenticity check turned off',
            icon: 'check',
        });
    };

    return (
        <Screen header={<ScreenHeader closeActionType="close" />}>
            <VStack spacing="sp32" flex={1}>
                <TitleHeader
                    titleVariant="titleMedium"
                    title={
                        <Translation id="moduleSettings.deviceChecks.firmwareAuthenticityCheck.turnOffModal.title" />
                    }
                    subtitle={
                        <Translation id="moduleSettings.deviceChecks.firmwareAuthenticityCheck.turnOffModal.content" />
                    }
                />
                <InformativeList />
                <Pressable onPress={handleCheckboxPress}>
                    <Card>
                        <HStack spacing="sp16">
                            <CheckBox isChecked={isChecked} onChange={handleCheckboxPress} />
                            <Text variant="highlight">
                                <Translation id="moduleSettings.deviceChecks.firmwareAuthenticityCheck.turnOffModal.acknowledgement" />
                            </Text>
                        </HStack>
                    </Card>
                </Pressable>
            </VStack>
            {isChecked && (
                <Animated.View
                    entering={FadeIn.duration(CHECKBOX_ANIMATION_DURATION)}
                    exiting={FadeOut.duration(CHECKBOX_ANIMATION_DURATION)}
                >
                    <Button colorScheme="yellowBold" onPress={handleButtonPress}>
                        <Translation id="moduleSettings.deviceChecks.firmwareAuthenticityCheck.turnOffModal.buttonTurnOff" />
                    </Button>
                </Animated.View>
            )}
        </Screen>
    );
};
