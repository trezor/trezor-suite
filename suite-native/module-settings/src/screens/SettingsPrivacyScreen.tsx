import { ReactNode } from 'react';
import { Platform } from 'react-native';
import { useSelector } from 'react-redux';

import { selectIsAnalyticsEnabled } from '@suite-common/analytics';
import { EventType, analytics } from '@suite-native/analytics';
import { Box, DiscreetCanvas, Text, VStack, useDiscreetMode } from '@suite-native/atoms';
import { useBiometricsSettings, useIsBiometricsEnabled } from '@suite-native/biometrics';
import { Translation, useTranslate } from '@suite-native/intl';
import { Screen, ScreenHeader } from '@suite-native/navigation';
import { useNativeStyles } from '@trezor/styles';

import { PressableSwitchRow } from '../components/PressableSwitchRow';

const RowDescription = ({ children }: { children: ReactNode }) => (
    <Text variant="hint" color="textSubdued">
        {children}
    </Text>
);

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
        <PressableSwitchRow
            testID="@settings/privacy-and-security/discreet-mode-toggle"
            text={<Translation id="moduleSettings.privacyAndSecurity.biometrics" />}
            accessibilityLabel="discreet-mode"
            description={
                <Box flexDirection="row" alignItems="center">
                    <RowDescription>{`$100 -> `}</RowDescription>
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
        <PressableSwitchRow
            text={<Translation id="moduleSettings.privacyAndSecurity.analyticsSwitch.title" />}
            iconName="database"
            accessibilityLabel="analytics"
            description={
                <RowDescription>
                    <Translation id="moduleSettings.privacyAndSecurity.analyticsSwitch.subtitle" />
                </RowDescription>
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
        <PressableSwitchRow
            isChecked={isBiometricsOptionEnabled}
            onChange={toggleBiometricsOption}
            accessibilityLabel="biometrics"
            text={<Translation id="moduleSettings.privacyAndSecurity.biometrics.title" />}
            iconName={Platform.OS === 'ios' ? 'fingerprintSimple' : 'fingerprint'}
            description={
                <RowDescription>
                    <Translation id="moduleSettings.privacyAndSecurity.biometrics.subtitle" />
                </RowDescription>
            }
        />
    );
};

export const SettingsPrivacyScreen = () => {
    const { translate } = useTranslate();

    return (
        <Screen
            header={<ScreenHeader content={translate('moduleSettings.privacyAndSecurity.title')} />}
        >
            <VStack spacing="sp16">
                <BiometricsSwitchRow />
                <DiscreetModeSwitchRow />
                <AnalyticsSwitchRow />
            </VStack>
        </Screen>
    );
};
