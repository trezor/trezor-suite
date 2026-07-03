import { useCallback } from 'react';

import { useNavigation } from '@react-navigation/native';

import { Screen, ScreenHeader, useInterceptNativeNavigation } from '@suite-native/navigation';

import { ConfirmLocationButton } from '../components/ConfirmLocationButton';
import { TradingLocationSettings } from '../components/TradingLocationSettings';
import { useCountrySelectionAnalyticsReport } from '../hooks/useCountrySelectionAnalyticsReport';

export const SettingsTradingLocationScreen = () => {
    const navigation = useNavigation();
    const analyticsReport = useCountrySelectionAnalyticsReport();

    const reportCancel = useCallback(() => analyticsReport('cancel'), [analyticsReport]);
    const reportCancelAndGoBack = useCallback(() => {
        analyticsReport('cancel');
        navigation.goBack();
    }, [analyticsReport, navigation]);

    useInterceptNativeNavigation({
        onPress: reportCancel,
        preventDefaultNavigation: false,
    });

    return (
        <Screen header={<ScreenHeader closeAction={reportCancelAndGoBack} />}>
            <TradingLocationSettings context="settings">
                <ConfirmLocationButton
                    afterConfirm={navigation.goBack}
                    testId="@settings/confirmLocation"
                />
            </TradingLocationSettings>
        </Screen>
    );
};
