import { IconButton, PictogramTitleHeader, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';
import { EXPERIMENTAL_FEATURES_KB_URL } from '@trezor/urls';

export const SettingsExperimentalScreen = () => {
    const openLink = useOpenLink();

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
            <VStack marginTop="sp32" spacing="sp16">
                <PictogramTitleHeader
                    variant="info"
                    title={<Translation id="moduleSettings.experimental.noneAvailable.title" />}
                    titleVariant="headline-md"
                    subtitle={
                        <Translation id="moduleSettings.experimental.noneAvailable.subtitle" />
                    }
                />
            </VStack>
        </Screen>
    );
};
