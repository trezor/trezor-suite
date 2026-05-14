import { FormattedList } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';

import { networksCollection } from '@suite-common/wallet-config';
import { selectIsNetworkReserveEnabled, setNetworkReserve } from '@suite-common/wallet-core';
import { events } from '@suite-native/analytics';
import { TouchableSwitchRow } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { useAnalytics } from '@suite-native/services';
import { NETWORK_RESERVE_URL } from '@trezor/urls';

export const ToggleNetworkReserveCheckCard = () => {
    const isNetworkReserveEnabled = useSelector(selectIsNetworkReserveEnabled);

    const dispatch = useDispatch();
    const analytics = useAnalytics();
    const openLink = useOpenLink();

    const supportedNetworks = networksCollection
        .filter(network => !!network.nativeTokenReserve)
        .map(network => network.name);

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
            isChecked={isNetworkReserveEnabled}
            onChange={toggleNetworkReserve}
            accessibilityLabel="network reserve"
            text={<Translation id="moduleSettings.advanced.networkReserve.title" />}
            onLearnMorePress={handleLearnMorePress}
            icon="graph"
            description={
                <Translation
                    id="moduleSettings.advanced.networkReserve.subtitle"
                    values={{
                        supportedNetworks: (
                            <FormattedList type="conjunction" value={supportedNetworks} />
                        ),
                    }}
                />
            }
        />
    );
};
