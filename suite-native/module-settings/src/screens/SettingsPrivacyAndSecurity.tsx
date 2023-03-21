import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Screen, ScreenHeader } from '@suite-native/navigation';
import { disableAnalyticsThunk, enableAnalyticsThunk } from '@suite-native/analytics';
import { selectIsAnalyticsEnabled } from '@suite-common/analytics';
import { Card } from '@suite-native/atoms';

import { TouchableSwitchRow } from '../components/TouchableSwitchRow';

export const SettingsPrivacyAndSecurity = () => {
    const dispatch = useDispatch();
    const isAnalyticsEnabled = useSelector(selectIsAnalyticsEnabled);

    const handleAnalyticsChange = (isEnabled: boolean) => {
        if (isEnabled) {
            dispatch(enableAnalyticsThunk());
            return;
        }
        dispatch(disableAnalyticsThunk());
    };

    return (
        <Screen header={<ScreenHeader title="Privacy & Security" />}>
            <Card>
                <TouchableSwitchRow
                    text="Hide balances"
                    description={
                        "Enabling this will route all of Suite's traffic through the Tor network, increasing your privacy and security."
                    }
                    iconName="detective"
                    isChecked={isAnalyticsEnabled}
                    onChange={handleAnalyticsChange}
                />
                <TouchableSwitchRow
                    text="Usage data"
                    iconName="database"
                    description={
                        "Enabling this will route all of Suite's traffic through the Tor network, increasing your privacy and security."
                    }
                    isChecked={isAnalyticsEnabled}
                    onChange={handleAnalyticsChange}
                />
            </Card>
        </Screen>
    );
};
