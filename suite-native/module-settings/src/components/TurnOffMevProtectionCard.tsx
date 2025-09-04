import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { networksCollection } from '@suite-common/wallet-config';
import { selectIsMevProtectionEnabled, setMevProtection } from '@suite-common/wallet-core';
import { Translation } from '@suite-native/intl';

import { TurnOffCheckCard } from './TurnOffCheckCard';

export const TurnOffMevProtectionCard = () => {
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

    const handleTurnOn = () => {
        dispatch(setMevProtection(true));
    };

    const handleTurnOff = () => {
        dispatch(setMevProtection(false));
    };

    return (
        <TurnOffCheckCard
            isEnabled={isMevProtectionEnabled}
            title={<Translation id="moduleSettings.advanced.mevProtection.title" />}
            subtitle={
                <Translation
                    id="moduleSettings.advanced.mevProtection.subtitle"
                    values={{ supportedNetworks }}
                />
            }
            icon="shield"
            onTurnOn={handleTurnOn}
            onTurnOff={handleTurnOff}
        />
    );
};
