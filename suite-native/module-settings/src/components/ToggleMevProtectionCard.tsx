import { useSelector } from 'react-redux';

import { useDispatch } from '@suite-common/redux-utils';
import { getNetworksWithMevProtection } from '@suite-common/wallet-config';
import { selectIsMevProtectionEnabled, setMevProtection } from '@suite-common/wallet-core';
import { TouchableSwitchRow } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export const ToggleMevProtectionCard = () => {
    const isMevProtectionEnabled = useSelector(selectIsMevProtectionEnabled);
    const dispatch = useDispatch();

    const handleToggle = (value: boolean) => {
        dispatch(setMevProtection(value));
    };

    return (
        <TouchableSwitchRow
            icon="shieldCheckered"
            text={<Translation id="moduleSettings.security.mevProtection.title" />}
            accessibilityLabel="MEV protection"
            description={<Translation id="moduleSettings.security.mevProtection.subtitle" />}
            additionalInfo={
                <Translation
                    id="moduleSettings.availableOn"
                    values={{ supportedNetworks: getNetworksWithMevProtection() }}
                />
            }
            isChecked={isMevProtectionEnabled}
            onChange={handleToggle}
        />
    );
};
