import { useDispatch, useSelector } from 'react-redux';

import { selectIsNetworkReserveEnabled, setNetworkReserve } from '@suite-common/wallet-core';
import { events } from '@suite-native/analytics';
import { TouchableSwitchRow } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useAnalytics } from '@suite-native/services';
import { NETWORK_RESERVE_URL } from '@trezor/urls';

export const TurnOffNetworkReserveCheckCard = () => {
    const isNetworkReserveEnabled = useSelector(selectIsNetworkReserveEnabled);
    const dispatch = useDispatch();
    const analytics = useAnalytics();

    const toggleNetworkReserve = (value: boolean) => {
        analytics.report({
            type: events.settingsNetworkReserveToggleEvent.name,
            payload: {
                enabled: value,
            },
        });
        dispatch(setNetworkReserve(value));
    };

    return (
        <TouchableSwitchRow
            isChecked={isNetworkReserveEnabled}
            onChange={toggleNetworkReserve}
            accessibilityLabel="network reserve"
            text={<Translation id="moduleSettings.advanced.networkReserve.title" />}
            learnMoreUrl={NETWORK_RESERVE_URL}
            icon="graph"
            description={<Translation id="moduleSettings.advanced.networkReserve.subtitle" />}
        />
    );
};
