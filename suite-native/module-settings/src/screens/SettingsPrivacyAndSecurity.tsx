import React, { ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { analytics, EventType } from '@suite-native/analytics';
import { Screen, ScreenHeader } from '@suite-native/navigation';
import { selectIsAnalyticsEnabled } from '@suite-common/analytics';
import { Box, Card, DiscreetCanvas, Text, useDiscreetMode } from '@suite-native/atoms';
import { useNativeStyles } from '@trezor/styles';
import {
    authenticate,
    getIsBiometricsFeatureAvailable,
    useIsBiometricsEnabled,
    useIsBiometricsOverlayVisible,
    useIsUserAuthenticated,
} from '@suite-native/biometrics';
import { useAlert } from '@suite-native/alerts';

import { TouchableSwitchRow } from '../components/TouchableSwitchRow';

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
        <TouchableSwitchRow
            text="Discreet mode"
            description={
                <Box flexDirection="row" alignItems="center">
                    <RowDescription>{`$100 -> `}</RowDescription>
                    <DiscreetTextExample />
                </Box>
            }
            iconName="detective"
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
            text="Usage data"
            iconName="database"
            description={
                <RowDescription>
                    All collected data is anonymous and is only used to improve the Trezor
                    ecosystem.
                </RowDescription>
            }
            isChecked={isAnalyticsEnabled}
            onChange={handleAnalyticsChange}
        />
    );
};

const BiometricsSwitchRow = () => {
    const { showAlert } = useAlert();
    const { setIsUserAuthenticated } = useIsUserAuthenticated();
    const { isBiometricsOptionEnabled, setIsBiometricsOptionEnabled } = useIsBiometricsEnabled();
    const { setIsBiometricsOverlayVisible } = useIsBiometricsOverlayVisible();

    const toggleBiometricsOption = async () => {
        const isBiometricsAvailable = await getIsBiometricsFeatureAvailable();

        if (!isBiometricsAvailable) {
            showAlert({
                title: 'Biometrics',
                description:
                    'No security features on your device. Make sure you have biometrics setup on your phone and try again.',
                primaryButtonTitle: 'Cancel',
                onPressPrimaryButton: () => null,
                icon: 'warningCircle',
                pictogramVariant: 'yellow',
            });
            return;
        }

        const authResult = await authenticate();

        if (!authResult?.success) {
            return;
        }

        if (isBiometricsOptionEnabled) {
            setIsBiometricsOptionEnabled(false);
            setIsUserAuthenticated(false);
            analytics.report({
                type: EventType.SettingsBiometricsToggle,
                payload: { enabled: false },
            });
        } else {
            setIsUserAuthenticated(true);
            setIsBiometricsOptionEnabled(true);
            analytics.report({
                type: EventType.SettingsBiometricsToggle,
                payload: { enabled: true },
            });
        }

        setIsBiometricsOverlayVisible(false);
    };

    return (
        <TouchableSwitchRow
            isChecked={isBiometricsOptionEnabled}
            onChange={toggleBiometricsOption}
            text="Biometrics"
            iconName="userFocus"
            description={
                <RowDescription>
                    Use facial or fingerprint verification to unlock the app
                </RowDescription>
            }
        />
    );
};

export const SettingsPrivacyAndSecurity = () => (
    <Screen header={<ScreenHeader content="Privacy & Security" />}>
        <Card>
            <BiometricsSwitchRow />
            <DiscreetModeSwitchRow />
            <AnalyticsSwitchRow />
        </Card>
    </Screen>
);
