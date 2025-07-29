import { useState } from 'react';
import { useSelector } from 'react-redux';

import { A } from '@mobily/ts-belt';

import { selectPhysicalDevices } from '@suite-common/wallet-core';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';
import { Translation } from '@suite-native/intl';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';

import { AboutTitle } from '../components/ViewOnly/About';
import { AboutViewOnlyBottomSheet } from '../components/ViewOnly/AboutViewOnlyBottomSheet';
import { DevicesEmpty } from '../components/ViewOnly/DevicesEmpty';
import { DevicesManagement } from '../components/ViewOnly/DevicesManagement';

export const SettingsAutoEjectScreen = () => {
    const [isVisibleAboutViewOnly, setIsVisibleAboutViewOnly] = useState(false);

    const isViewOnlyByDefaultEnabled = useFeatureFlag(FeatureFlag.IsViewOnlyByDefaultEnabled);

    const devices = useSelector(selectPhysicalDevices);

    const showAboutViewOnly = () => setIsVisibleAboutViewOnly(true);

    return (
        <Screen
            header={
                <DynamicScreenHeader
                    title={
                        isViewOnlyByDefaultEnabled ? (
                            <Translation id="moduleSettings.viewOnly.autoEject.title" />
                        ) : (
                            <Translation id="moduleSettings.viewOnly.title" />
                        )
                    }
                    isCompactOnly={A.isEmpty(devices) && !isViewOnlyByDefaultEnabled ? true : false}
                    subtitle={
                        A.isNotEmpty(devices) && !isViewOnlyByDefaultEnabled ? (
                            <AboutTitle onPressAbout={showAboutViewOnly} />
                        ) : (
                            <Translation id="moduleSettings.viewOnly.autoEject.subtitle" />
                        )
                    }
                />
            }
        >
            {A.isEmpty(devices) && !isViewOnlyByDefaultEnabled ? (
                <DevicesEmpty onPressAbout={showAboutViewOnly} />
            ) : (
                <DevicesManagement />
            )}
            <AboutViewOnlyBottomSheet
                isVisible={isVisibleAboutViewOnly}
                onClose={() => setIsVisibleAboutViewOnly(false)}
            />
        </Screen>
    );
};
