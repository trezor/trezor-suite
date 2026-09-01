import { useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { useDispatch } from '@suite-common/redux-utils';
import { getNetworksWithNativeTokenReserve } from '@suite-common/wallet-config';
import { selectIsNetworkReserveEnabled, setNetworkReserve } from '@suite-common/wallet-core';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { TouchableSwitchRow } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { NETWORK_RESERVE_URL } from '@trezor/urls';

export const ToggleNetworkReserveCheckCard = () => {
    const isNetworkReserveEnabled = useSelector(selectIsNetworkReserveEnabled);

    const dispatch = useDispatch();
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const openLink = useOpenLink();

    const supportedNetworks = getNetworksWithNativeTokenReserve();

    const toggleNetworkReserve = (value: boolean) => {
        analytics.report({
            type: events.settingsNetworkReserveToggleEvent.name,
            payload: {
                enabled: value,
            },
        });
        dispatch(setNetworkReserve(value));
    };

    const handleLearnMorePress = () => {
        openLink(NETWORK_RESERVE_URL);
    };

    return (
        <TouchableSwitchRow
            icon="graph"
            text={<Translation id="moduleSettings.advanced.networkReserve.title" />}
            accessibilityLabel="network reserve"
            description={
                <Translation
                    id="moduleSettings.advanced.networkReserve.subtitle"
                    values={{
                        supportedNetworks,
                    }}
                />
            }
            additionalInfo={
                <Translation id="moduleSettings.availableOn" values={{ supportedNetworks }} />
            }
            onLearnMorePress={handleLearnMorePress}
            isChecked={isNetworkReserveEnabled}
            onChange={toggleNetworkReserve}
        />
    );
};
