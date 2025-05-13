import { ReactNode, useState } from 'react';
import { Pressable } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

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
import { useToast } from '@suite-native/toasts';

const CHECKBOX_ANIMATION_DURATION = 200; // same as in useAccordionAnimation

const InformativeList = () => (
    <VStack spacing="sp24">
        <IconListItem icon="warning" variant="yellow" iconSize="large" verticalAlign="flex-start">
            <VStack spacing="sp4">
                <Text variant="highlight">
                    <Translation id="moduleSettings.advanced.authenticityChecks.turnOff.item1" />
                </Text>
                <Text variant="hint" color="textSubdued">
                    <Translation id="moduleSettings.advanced.authenticityChecks.turnOff.item1Explanation" />
                </Text>
            </VStack>
        </IconListItem>
        <IconListItem icon="code" variant="yellow" iconSize="large" verticalAlign="flex-start">
            <VStack spacing="sp4">
                <Text variant="highlight">
                    <Translation id="moduleSettings.advanced.authenticityChecks.turnOff.item2" />
                </Text>
                <Text variant="hint" color="textSubdued">
                    <Translation id="moduleSettings.advanced.authenticityChecks.turnOff.item2Explanation" />
                </Text>
            </VStack>
        </IconListItem>
    </VStack>
);

type NavigationProp = StackNavigationProps<
    SettingsStackParamList,
    SettingsStackRoutes.SettingsDeviceChecks
>;

type TurnOffCheckScreenContentProps = {
    title: ReactNode;
    onConfirm: () => void;
};

export const TurnOffCheckScreenContent = ({ title, onConfirm }: TurnOffCheckScreenContentProps) => {
    const [isChecked, setIsChecked] = useState(false);
    const navigation = useNavigation<NavigationProp>();
    const { showToast } = useToast();

    const handleCheckboxPress = () => setIsChecked(prev => !prev);

    const handleButtonPress = () => {
        onConfirm();
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.navigate(SettingsStackRoutes.SettingsDeviceChecks);
        }
        showToast({
            variant: 'default',
            message: <Translation id="moduleSettings.advanced.authenticityChecks.toastOff" />,
            icon: 'check',
        });
    };

    return (
        <Screen header={<ScreenHeader closeActionType="close" />}>
            <VStack spacing="sp32" marginTop="sp8" flex={1}>
                <TitleHeader
                    titleVariant="titleMedium"
                    title={title}
                    subtitle={
                        <Translation id="moduleSettings.advanced.authenticityChecks.turnOff.content" />
                    }
                />
                <InformativeList />
                <Pressable onPress={handleCheckboxPress}>
                    <Card
                        alertProps={{
                            variant: 'warning',
                            title: (
                                <Text variant="callout">
                                    <Translation id="moduleSettings.advanced.authenticityChecks.turnOff.acknowledgementNote" />
                                </Text>
                            ),
                        }}
                        alertPosition="bottom"
                    >
                        <HStack spacing="sp16" justifyContent="space-between">
                            <Text>
                                <Translation id="moduleSettings.advanced.authenticityChecks.turnOff.acknowledgement" />
                            </Text>
                            <CheckBox isChecked={isChecked} onChange={handleCheckboxPress} />
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
                        <Translation id="moduleSettings.advanced.authenticityChecks.buttonTurnOff" />
                    </Button>
                </Animated.View>
            )}
        </Screen>
    );
};
