import { useDispatch, useSelector } from 'react-redux';

import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { selectNativeAnalyticsDep } from '@suite-native/analytics';
import { TouchableSwitchRow } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { selectAreTestnetsEnabled, toggleAreTestnetsEnabled } from '@suite-native/settings';

export const ToggleTestnetsCard = () => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectNativeAnalyticsDep);

    const areTestnetsEnabled = useSelector(selectAreTestnetsEnabled);

    const handleToggleTestnets = (value: boolean) => {
        dispatch(toggleAreTestnetsEnabled());

        analytics.report({
            type: events.settingsTestnetNetworksToggleEvent.name,
            payload: { enabled: value },
        });
    };

    return (
        <TouchableSwitchRow
            icon="coinSlash"
            isChecked={areTestnetsEnabled}
            onChange={handleToggleTestnets}
            text={<Translation id="moduleSettings.advanced.testnets.title" />}
            description={<Translation id="moduleSettings.advanced.testnets.description" />}
            accessibilityLabel="Testnets toggle"
            testID="settings/testnets-touchable-row"
        />
    );
};
