import { useState } from 'react';
import { useSelector } from 'react-redux';

import { A } from '@mobily/ts-belt';

import { selectPhysicalDevices } from '@suite-common/wallet-core';
import { Translation } from '@suite-native/intl';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';

import { AboutViewOnlyBottomSheet } from '../components/ViewOnly/AboutViewOnlyBottomSheet';
import { DevicesEmpty } from '../components/ViewOnly/DevicesEmpty';
import { DevicesManagement } from '../components/ViewOnly/DevicesManagement';

export const SettingsViewOnlyScreen = () => {
    const [isVisibleAboutViewOnly, setIsVisibleAboutViewOnly] = useState(false);

    const devices = useSelector(selectPhysicalDevices);

    const showAboutViewOnly = () => setIsVisibleAboutViewOnly(true);

    return (
        <Screen
            header={
                <DynamicScreenHeader
                    content={<Translation id="moduleSettings.viewOnly.title" />}
                    isCompactOnly={A.isEmpty(devices)}
                />
            }
        >
            {A.isEmpty(devices) ? (
                <DevicesEmpty onPressAbout={showAboutViewOnly} />
            ) : (
                <DevicesManagement onPressAbout={showAboutViewOnly} />
            )}
            <AboutViewOnlyBottomSheet
                isVisible={isVisibleAboutViewOnly}
                onClose={() => setIsVisibleAboutViewOnly(false)}
            />
        </Screen>
    );
};
