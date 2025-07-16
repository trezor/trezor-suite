import { Platform } from 'react-native';
import { useSelector } from 'react-redux';

import { selectIsAnalyticsEnabled } from '@suite-common/analytics';
import { EventType, analytics } from '@suite-native/analytics';
import { Box, DiscreetCanvas, VStack, useDiscreetMode } from '@suite-native/atoms';
import { useBiometricsSettings, useIsBiometricsEnabled } from '@suite-native/biometrics';
import { Translation } from '@suite-native/intl';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';
import { useNativeStyles } from '@trezor/styles';

import {
    TouchableSwitchRow,
    TouchableSwitchRowDescription,
} from '../components/TouchableSwitchRow';

const DiscreetTextExample = () => {
    const { utils } = useNativeStyles();

    return (
        <Box style={{ height: utils.typography.hint.lineHeight }}>
            <DiscreetCanvas
                text="$100"
                color="textSubdued"
                width={30}
                fontSize={utils.typography.hint.fontSize}
                height={utils.typography.hint.lineHeight}
            />
        </Box>
    );
};

const DiscreetModeSwitchRow = () => {
    const { isDiscreetMode, setIsDiscreetMode } = useDiscreetMode();

    const handleSetDiscreetMode = (value: boolean) => {
        setIsDiscreetMode(value);
        analytics.report({
            type: EventType.SettingsDiscreetToggle,
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
            iconName="eyeSlash"
            isChecked={isDiscreetMode}
            onChange={handleSetDiscreetMode}
        />
    );
};

const AnalyticsSwitchRow = () => {
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
            iconName="database"
            accessibilityLabel="analytics"
            description={
                <TouchableSwitchRowDescription>
                    <Translation id="moduleSettings.privacyAndSecurity.analyticsSwitch.subtitle" />
                </TouchableSwitchRowDescription>
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
            iconName={Platform.OS === 'ios' ? 'fingerprintSimple' : 'fingerprint'}
            description={
                <TouchableSwitchRowDescription>
                    <Translation id="moduleSettings.privacyAndSecurity.biometrics.subtitle" />
                </TouchableSwitchRowDescription>
            }
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
