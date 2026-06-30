import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { networksCollection } from '@suite-common/wallet-config';
import { selectIsMevProtectionEnabled, setMevProtection } from '@suite-common/wallet-core';
import { TouchableSwitchRow } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';

export const ToggleMevProtectionCard = () => {
    const { translate } = useTranslate();
    const isMevProtectionEnabled = useSelector(selectIsMevProtectionEnabled);
    const dispatch = useDispatch();

    const supportedNetworks = useMemo(
        () =>
            networksCollection
                .filter(network => network.features.includes('mev-protection'))
                .map(network => network.name)
                .join(', '),
        [],
    );

    const handleToggle = (value: boolean) => {
        dispatch(setMevProtection(value));
    };

    return (
        <TouchableSwitchRow
            isChecked={isMevProtectionEnabled}
            onChange={handleToggle}
            accessibilityLabel={translate('moduleSettings.advanced.mevProtection.title')}
            text={<Translation id="moduleSettings.advanced.mevProtection.title" />}
            description={
                <Translation
                    id="moduleSettings.advanced.mevProtection.subtitle"
                    values={{ supportedNetworks }}
                />
            }
            icon="shield"
        />
    );
};
