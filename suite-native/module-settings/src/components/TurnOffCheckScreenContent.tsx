import { type ReactNode, useState } from 'react';
import { Pressable } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { useNavigation } from '@react-navigation/native';

import {
    Box,
    Button,
    Card,
    CheckBox,
    HStack,
    IconList,
    IconListTitledItem,
    Text,
    TitleHeader,
    VStack,
} from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    Screen,
    ScreenHeader,
    type SettingsStackParamList,
    SettingsStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { useToast } from '@suite-native/toasts';

const CHECKBOX_ANIMATION_DURATION = 200; // same as in useAccordionAnimation

const InformativeList = () => (
    <IconList iconIntent="warning" verticalAlign="flex-start">
        <IconListTitledItem
            icon="warning"
            title={<Translation id="moduleSettings.advanced.authenticityChecks.turnOff.item1" />}
        >
            <Translation id="moduleSettings.advanced.authenticityChecks.turnOff.item1Explanation" />
        </IconListTitledItem>
        <IconListTitledItem
            icon="code"
            title={<Translation id="moduleSettings.advanced.authenticityChecks.turnOff.item2" />}
        >
            <Translation id="moduleSettings.advanced.authenticityChecks.turnOff.item2Explanation" />
        </IconListTitledItem>
    </IconList>
);

type NavigationProp = StackNavigationProps<
    SettingsStackParamList,
    SettingsStackRoutes.SettingsAdvanced
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
            navigation.navigate(SettingsStackRoutes.SettingsAdvanced);
        }
        showToast({
            intent: 'neutral',
            message: <Translation id="moduleSettings.advanced.authenticityChecks.toastOff" />,
            icon: 'check',
        });
    };

    return (
        <Screen header={<ScreenHeader closeActionType="close" />}>
            <VStack spacing="sp32" marginTop="sp8" flex={1}>
                <TitleHeader
                    titleVariant="headline-md"
                    title={title}
                    subtitle={
                        <Translation id="moduleSettings.advanced.authenticityChecks.turnOff.content" />
                    }
                />
                <InformativeList />
                <Pressable onPress={handleCheckboxPress}>
                    <Card
                        alertProps={{
                            intent: 'warning',
                            title: (
                                <Text variant="body-sm-strong">
                                    <Translation id="moduleSettings.advanced.authenticityChecks.turnOff.acknowledgementNote" />
                                </Text>
                            ),
                        }}
                        alertPosition="bottom"
                    >
                        <HStack spacing="sp16" justifyContent="space-between">
                            <Box flex={1}>
                                <Text>
                                    <Translation id="moduleSettings.advanced.authenticityChecks.turnOff.acknowledgement" />
                                </Text>
                            </Box>
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
                    <Button intent="warning" priority="primary" onPress={handleButtonPress}>
                        <Translation id="moduleSettings.advanced.authenticityChecks.buttonTurnOff" />
                    </Button>
                </Animated.View>
            )}
        </Screen>
    );
};
