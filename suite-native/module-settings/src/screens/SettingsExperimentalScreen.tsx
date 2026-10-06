import { IconButton, PictogramTitleHeader, VStack } from '@suite-native/atoms';
import { EXPERIMENTAL_FEATURES } from '@suite-native/experimental-features';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';
import { EXPERIMENTAL_FEATURES_KB_URL } from '@trezor/urls';
import { typedObjectKeys } from '@trezor/utils';

import { ExperimentalFeatureRow } from '../components/ExperimentalFeatureRow';

const ExperimentalFeaturesList = () => (
    <VStack spacing="sp16">
        {typedObjectKeys(EXPERIMENTAL_FEATURES).map(feature => (
            <ExperimentalFeatureRow key={feature} feature={feature} />
        ))}
    </VStack>
);

const ExperimentalFeaturesEmptyState = () => (
    <VStack marginTop="sp32" spacing="sp16">
        <PictogramTitleHeader
            variant="info"
            title={<Translation id="moduleSettings.experimental.noneAvailable.title" />}
            titleVariant="headline-md"
            subtitle={<Translation id="moduleSettings.experimental.noneAvailable.subtitle" />}
        />
    </VStack>
);

export const SettingsExperimentalScreen = () => {
    const openLink = useOpenLink();

    const hasExperimentalFeatures = typedObjectKeys(EXPERIMENTAL_FEATURES).length > 0;

    const onInfoPress = () => {
        openLink(EXPERIMENTAL_FEATURES_KB_URL);
    };

    return (
        <Screen
            header={
                <DynamicScreenHeader
                    title={<Translation id="moduleSettings.experimental.title" />}
                    subtitle={<Translation id="moduleSettings.experimental.subtitle" />}
                    rightIcon={
                        <IconButton
                            iconName="info"
                            intent="neutral"
                            priority="secondary"
                            size="medium"
                            onPress={onInfoPress}
                            accessibilityRole="button"
                            accessibilityLabel="More info"
                        />
                    }
                />
            }
        >
            {hasExperimentalFeatures ? (
                <ExperimentalFeaturesList />
            ) : (
                <ExperimentalFeaturesEmptyState />
            )}
        </Screen>
    );
};
