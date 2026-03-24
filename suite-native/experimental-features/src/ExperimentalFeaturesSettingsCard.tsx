import { type LayoutChangeEvent, View } from 'react-native';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useDispatch, useSelector } from 'react-redux';

import {
    AnimatedBox,
    Box,
    Button,
    Card,
    HStack,
    InlineAlertBox,
    PressableOpacity,
    Switch,
    Text,
    VStack,
} from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { useNativeServices } from '@suite-native/services';
import {
    allowExperimentalFeatures,
    disallowExperimentalFeatures,
    selectAreExperimentalFeaturesAllowed,
    selectEnabledExperimentalFeatures,
} from '@suite-native/settings';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { EXPERIMENTAL_FEATURES_KB_URL } from '@trezor/urls';
import { typedObjectKeys } from '@trezor/utils';

import { ExperimentalFeatureRow } from './ExperimentalFeatureRow';
import { EXPERIMENTAL_FEATURES } from './experimentalFeatures';

const ANIMATION_DURATION = 200;

const contentWrapperStyle = prepareNativeStyle(() => ({
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
}));

export const ExperimentalFeaturesSettingsCard = () => {
    const { applyStyle } = useNativeStyles();
    const services = useNativeServices();
    const dispatch = useDispatch();
    const openLink = useOpenLink();
    const enabledFeatures = useSelector(selectEnabledExperimentalFeatures);
    const areExperimentalFeaturesAllowed = useSelector(selectAreExperimentalFeaturesAllowed);
    const contentHeight = useSharedValue(0);

    const animatedHeightStyle = useAnimatedStyle(() => ({
        height: withTiming(areExperimentalFeaturesAllowed ? contentHeight.value : 0, {
            duration: ANIMATION_DURATION,
        }),
        overflow: 'hidden',
    }));

    const animatedAlertStyle = useAnimatedStyle(() => ({
        opacity: withTiming(areExperimentalFeaturesAllowed ? 1 : 0, {
            duration: ANIMATION_DURATION,
        }),
        maxHeight: withTiming(areExperimentalFeaturesAllowed ? 200 : 0, {
            duration: ANIMATION_DURATION,
        }),
        overflow: 'hidden',
    }));

    const handleContentLayout = ({ nativeEvent }: LayoutChangeEvent) => {
        contentHeight.value = nativeEvent.layout.height;
    };

    const handleToggleExperimental = () => {
        enabledFeatures?.forEach(featureKey =>
            EXPERIMENTAL_FEATURES[featureKey]?.onToggle?.({
                newValue: !areExperimentalFeaturesAllowed,
                services,
            }),
        );

        dispatch(
            areExperimentalFeaturesAllowed
                ? disallowExperimentalFeatures()
                : allowExperimentalFeatures(),
        );
    };

    const handleLearnMore = () => {
        openLink(EXPERIMENTAL_FEATURES_KB_URL);
    };

    const experimentalFeatureKeys = typedObjectKeys(EXPERIMENTAL_FEATURES);

    if (experimentalFeatureKeys.length === 0) {
        return null;
    }

    return (
        <Card borderColor="borderElevation1" noPadding testID="@settings/experimental-features">
            <PressableOpacity onPress={handleToggleExperimental} accessibilityRole="togglebutton">
                <VStack spacing="sp16" margin="sp16">
                    <HStack spacing="sp12">
                        <Box marginVertical="sp2">
                            <Icon name="atom" size="mediumLarge" />
                        </Box>
                        <VStack flex={1}>
                            <HStack justifyContent="space-between" alignItems="center">
                                <Text variant="body-md-strong">
                                    <Translation id="moduleSettings.advanced.experimentalFeatures.title" />
                                </Text>
                                <Switch
                                    isChecked={areExperimentalFeaturesAllowed}
                                    onChange={handleToggleExperimental}
                                    testID="@settings/experimental-features/toggle-switch"
                                />
                            </HStack>
                            <Text variant="body-sm" color="textSubdued">
                                <Translation id="moduleSettings.advanced.experimentalFeatures.subtitle" />
                            </Text>
                            <AnimatedBox style={animatedAlertStyle}>
                                <Box marginBottom="sp8">
                                    <InlineAlertBox
                                        variant="warning"
                                        title={
                                            <Translation id="moduleSettings.advanced.experimentalFeatures.warning" />
                                        }
                                    />
                                </Box>
                            </AnimatedBox>
                            <VStack>
                                <Button
                                    size="small"
                                    viewLeft="arrowSquareOut"
                                    onPress={handleLearnMore}
                                    colorScheme="tertiaryElevation0"
                                >
                                    <Translation id="generic.buttons.learnMore" />
                                </Button>
                            </VStack>
                        </VStack>
                    </HStack>
                </VStack>
            </PressableOpacity>

            <AnimatedBox style={animatedHeightStyle}>
                <View style={applyStyle(contentWrapperStyle)}>
                    <View collapsable={false} onLayout={handleContentLayout}>
                        {experimentalFeatureKeys.map(featureKey => (
                            <ExperimentalFeatureRow key={featureKey} featureKey={featureKey} />
                        ))}
                    </View>
                </View>
            </AnimatedBox>
        </Card>
    );
};
