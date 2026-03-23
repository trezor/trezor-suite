import { Platform } from 'react-native';
import { useSelector } from 'react-redux';

import { selectIsAnalyticsEnabled } from '@suite-common/analytics-redux';
import { events } from '@suite-native/analytics';
import {
    Box,
    DiscreetCanvas,
    TouchableSwitchRow,
    TouchableSwitchRowDescription,
    VStack,
    useDiscreetMode,
} from '@suite-native/atoms';
import { useBiometricsSettings, useIsBiometricsEnabled } from '@suite-native/biometrics';
import { Translation } from '@suite-native/intl';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';
import { useNativeStyles } from '@trezor/styles-native';

const DiscreetTextExample = () => {
    const { utils } = useNativeStyles();

    return (
        <Box style={{ height: utils.typography['body-sm'].lineHeight }}>
            <DiscreetCanvas
                text="$100"
                color="textSubdued"
                width={30}
                fontSize={utils.typography['body-sm'].fontSize}
                height={utils.typography['body-sm'].lineHeight}
            />
        </Box>
    );
};

const DiscreetModeSwitchRow = () => {
    const { isDiscreetMode, setIsDiscreetMode } = useDiscreetMode();
    const analytics = useAnalytics();
    const handleSetDiscreetMode = (value: boolean) => {
        setIsDiscreetMode(value);
        analytics.report({
            type: events.settingsDiscreetToggleEvent.name,
            payload: { discreetMode: value },
        });
    };

    return (
        <TouchableSwitchRow
            testID="@settings/privacy-and-security/discreet-mode-toggle"
            text={<Translation id="moduleSettings.privacyAndSecurity.discreetMode" />}
            accessibilityLabel="discreet-mode"
            description={
                <Box flexDirection="row" alignItems="center">
                    <TouchableSwitchRowDescription>{`$100 -> `}</TouchableSwitchRowDescription>
                    <DiscreetTextExample />
                </Box>
            }
            icon="eyeSlash"
            isChecked={isDiscreetMode}
            onChange={handleSetDiscreetMode}
        />
    );
};

const AnalyticsSwitchRow = () => {
    const analytics = useAnalytics();
    const isAnalyticsEnabled = useSelector(selectIsAnalyticsEnabled);

    const handleAnalyticsChange = (isEnabled: boolean) => {
        if (isEnabled) {
            analytics.enable();

            return;
        }
        analytics.disable();
    };

    return (
        <TouchableSwitchRow
            text={<Translation id="moduleSettings.privacyAndSecurity.analyticsSwitch.title" />}
            icon="database"
            accessibilityLabel="analytics"
            description={
                <Translation id="moduleSettings.privacyAndSecurity.analyticsSwitch.subtitle" />
            }
            isChecked={isAnalyticsEnabled}
            onChange={handleAnalyticsChange}
        />
    );
};

const BiometricsSwitchRow = () => {
    const { isBiometricsOptionEnabled } = useIsBiometricsEnabled();
    const { toggleBiometricsOption } = useBiometricsSettings();

    return (
        <TouchableSwitchRow
            isChecked={isBiometricsOptionEnabled}
            onChange={toggleBiometricsOption}
            accessibilityLabel="biometrics"
            text={<Translation id="moduleSettings.privacyAndSecurity.biometrics.title" />}
            icon={Platform.OS === 'ios' ? 'fingerprintSimple' : 'fingerprint'}
            description={<Translation id="moduleSettings.privacyAndSecurity.biometrics.subtitle" />}
        />
    );
};

export const SettingsPrivacyScreen = () => (
    <Screen
        header={
            <DynamicScreenHeader
                title={<Translation id="moduleSettings.privacyAndSecurity.title" />}
            />
        }
    >
        <VStack spacing="sp16">
            <BiometricsSwitchRow />
            <DiscreetModeSwitchRow />
            <AnalyticsSwitchRow />
        </VStack>
    </Screen>
);
