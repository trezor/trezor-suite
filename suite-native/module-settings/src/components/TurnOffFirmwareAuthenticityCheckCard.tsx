import { useDispatch, useSelector } from 'react-redux';

import {
    selectIsFirmwareAuthenticityCheckEnabled,
    setCheckFirmwareAuthenticity,
    SettingsCardWithIconLayout,
} from '@suite-native/settings';
import { Translation } from '@suite-native/intl';
import { Button, HStack, Text, VStack } from '@suite-native/atoms';
import { SettingsStackRoutes } from '@suite-native/navigation';
import { useOpenLink } from '@suite-native/link';
import { useToast } from '@suite-native/toasts';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { useSettingsNavigateTo } from '../navigation/useSettingsNavigateTo';

// TODO this page is for desktop; await creation of new page tailored to the suite-native UX
const HELP_CENTER_FIRMWARE_REVISION_CHECK =
    'https://trezor.io/learn/a/trezor-firmware-authenticity-check';

const fullWidthButtonStyle = prepareNativeStyle(() => ({ flex: 1 }));

const LearnMoreButton = () => {
    const { applyStyle } = useNativeStyles();
    const openLink = useOpenLink();
    const handleButtonPress = () => openLink(HELP_CENTER_FIRMWARE_REVISION_CHECK);

    return (
        <Button
            size="small"
            onPress={handleButtonPress}
            colorScheme="tertiaryElevation0"
            style={applyStyle(fullWidthButtonStyle)}
        >
            <Translation id="moduleSettings.deviceChecks.firmwareAuthenticityCheck.buttonLearnMore" />
        </Button>
    );
};

const TurnOnButton = () => {
    const { applyStyle } = useNativeStyles();
    const dispatch = useDispatch();
    const { showToast } = useToast();
    const handleButtonPress = () => {
        dispatch(setCheckFirmwareAuthenticity(true));
        showToast({
            variant: 'default',
            message: 'Authenticity check turned on',
            icon: 'check',
        });
    };

    return (
        <Button
            size="small"
            onPress={handleButtonPress}
            colorScheme="primary"
            style={applyStyle(fullWidthButtonStyle)}
        >
            <Translation id="moduleSettings.deviceChecks.firmwareAuthenticityCheck.buttonTurnOn" />
        </Button>
    );
};

const TurnOffButton = () => {
    const navigateTo = useSettingsNavigateTo();

    const handleButtonPress = () => {
        navigateTo(SettingsStackRoutes.TurnOffFirmwareAuthenticityCheckModal);
    };

    return (
        <Button size="small" onPress={handleButtonPress} colorScheme="redElevation0">
            <Translation id="moduleSettings.deviceChecks.firmwareAuthenticityCheck.buttonTurnOff" />
        </Button>
    );
};

export const TurnOffFirmwareAuthenticityCheckCard = () => {
    const isFwAuthenticityCheckEnabled = useSelector(selectIsFirmwareAuthenticityCheckEnabled);

    return (
        <SettingsCardWithIconLayout
            icon="shieldCheck"
            title={<Translation id="moduleSettings.deviceChecks.firmwareAuthenticityCheck.title" />}
        >
            <VStack spacing="sp16">
                <Text variant="hint" color="textSubdued">
                    <Translation id="moduleSettings.deviceChecks.firmwareAuthenticityCheck.subtitle" />
                </Text>
                <HStack spacing="sp8">
                    {isFwAuthenticityCheckEnabled ? (
                        <>
                            <TurnOffButton />
                            <LearnMoreButton />
                        </>
                    ) : (
                        <>
                            <LearnMoreButton />
                            <TurnOnButton />
                        </>
                    )}
                </HStack>
            </VStack>
        </SettingsCardWithIconLayout>
    );
};
