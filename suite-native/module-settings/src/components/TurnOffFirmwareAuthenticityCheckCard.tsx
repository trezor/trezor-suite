import { useDispatch, useSelector } from 'react-redux';

import { Button, HStack, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { SettingsStackRoutes } from '@suite-native/navigation';
import {
    SettingsCardWithIconLayout,
    selectIsFirmwareAuthenticityCheckEnabled,
    setCheckFirmwareAuthenticity,
} from '@suite-native/settings';
import { useToast } from '@suite-native/toasts';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { HELP_CENTER_FIRMWARE_REVISION_CHECK_MOBILE } from '@trezor/urls';

import { useSettingsNavigateTo } from '../navigation/useSettingsNavigateTo';

const fullWidthButtonStyle = prepareNativeStyle(() => ({ flex: 1 }));
const shrinkedButtonStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.sp16,
}));

const LearnMoreButton = ({ fullWidth }: { fullWidth?: boolean }) => {
    const { applyStyle } = useNativeStyles();
    const openLink = useOpenLink();
    const handleButtonPress = () => openLink(HELP_CENTER_FIRMWARE_REVISION_CHECK_MOBILE);

    return (
        <Button
            size="small"
            viewLeft="arrowSquareOut"
            onPress={handleButtonPress}
            colorScheme="tertiaryElevation0"
            style={applyStyle(fullWidth ? fullWidthButtonStyle : shrinkedButtonStyle)}
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
    const { applyStyle } = useNativeStyles();
    const navigateTo = useSettingsNavigateTo();

    const handleButtonPress = () => {
        navigateTo(SettingsStackRoutes.TurnOffFirmwareAuthenticityCheckModal);
    };

    return (
        <Button
            size="small"
            onPress={handleButtonPress}
            colorScheme="redElevation0"
            style={applyStyle(shrinkedButtonStyle)}
        >
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
                            <LearnMoreButton fullWidth />
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
