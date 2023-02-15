import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Screen, ScreenHeader } from '@suite-native/navigation';
import { disableAnalyticsThunk, enableAnalyticsThunk } from '@suite-native/analytics';
import { selectIsAnalyticsEnabled } from '@suite-common/analytics';

import { TouchableSwitchRow } from '../components/TouchableSwitchRow';

export const SettingsAnalyticsScreen = () => {
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
        <Screen>
            <ScreenHeader title="Analytics" />
            <TouchableSwitchRow
                text="Analytics"
                isChecked={isAnalyticsEnabled}
                onChange={handleAnalyticsChange}
            />
        </Screen>
    );
};
