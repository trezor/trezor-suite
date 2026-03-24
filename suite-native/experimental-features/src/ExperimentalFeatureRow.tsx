import { Pressable } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { CheckBox, Divider, HStack, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useNativeServices } from '@suite-native/services';
import {
    type ExperimentalFeature,
    type SettingsSliceRootState,
    disableExperimentalFeature,
    enableExperimentalFeature,
    selectIsExperimentalFeatureEnabled,
} from '@suite-native/settings';

import { EXPERIMENTAL_FEATURES } from './experimentalFeatures';

export const ExperimentalFeatureRow = ({ featureKey }: { featureKey: ExperimentalFeature }) => {
    const dispatch = useDispatch();
    const services = useNativeServices();
    const isFeatureEnabled = useSelector((state: SettingsSliceRootState) =>
        selectIsExperimentalFeatureEnabled(state, featureKey),
    );

    const config = EXPERIMENTAL_FEATURES[featureKey];
    if (!config) {
        return null;
    }
    const { titleKey, descriptionKey, onToggle } = config;

    const handleChange = () => {
        onToggle?.({ newValue: !isFeatureEnabled, services });

        if (isFeatureEnabled) {
            dispatch(disableExperimentalFeature(featureKey));
        } else {
            dispatch(enableExperimentalFeature(featureKey));
        }
    };

    return (
        <>
            <Divider />
            <Pressable onPress={handleChange} accessibilityRole="checkbox">
                <HStack justifyContent="space-between" alignItems="center" margin="sp16">
                    <VStack flex={1} spacing="sp2">
                        <Text>
                            <Translation id={titleKey} />
                        </Text>
                        <Text variant="body-sm" color="textSubdued">
                            <Translation id={descriptionKey} />
                        </Text>
                    </VStack>
                    <CheckBox
                        isChecked={isFeatureEnabled}
                        onChange={handleChange}
                        testID={`@settings/experimental-features/${featureKey}/checkbox`}
                    />
                </HStack>
            </Pressable>
        </>
    );
};
