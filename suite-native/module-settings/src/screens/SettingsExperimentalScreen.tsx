import { IconButton, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';
import { EXPERIMENTAL_FEATURES_KB_URL } from '@trezor/urls';

import { ToggleTronCard } from '../components/ToggleTronCard';

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
                            size="medium"
                            intent="neutral"
                            priority="secondary"
                            onPress={onInfoPress}
                            accessibilityRole="button"
                            accessibilityLabel="More info"
                        />
                    }
                />
            }
        >
            <VStack spacing="sp16">
                <ToggleTronCard />
            </VStack>
        </Screen>
    );
};
