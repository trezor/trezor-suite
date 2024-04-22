import { useSelector } from 'react-redux';
import { useState } from 'react';

import { A } from '@mobily/ts-belt';

import { Screen, ScreenSubHeader } from '@suite-native/navigation';
import { useTranslate } from '@suite-native/intl';
import { selectPhysicalDevices } from '@suite-common/wallet-core';

import { AboutViewOnlyBottomSheet } from '../components/ViewOnly/AboutViewOnlyBottomSheet';
import { DevicesManagement } from '../components/ViewOnly/DevicesManagement';
import { DevicesEmpty } from '../components/ViewOnly/DevicesEmpty';

export const SettingsViewOnly = () => {
    const { translate } = useTranslate();
    const [isVisibleAboutViewOnly, setIsVisibleAboutViewOnly] = useState(false);

    const devices = useSelector(selectPhysicalDevices);

    const showAboutViewOnly = () => setIsVisibleAboutViewOnly(true);

    return (
        <Screen
            screenHeader={<ScreenSubHeader content={translate('moduleSettings.viewOnly.title')} />}
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
