import { useDispatch, useSelector } from 'react-redux';

import { events } from '@suite-native/analytics';
import { TouchableSwitchRow } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useAnalytics } from '@suite-native/services';
import { selectIsTronEnabled, toggleIsTronEnabled } from '@suite-native/settings';

export const ToggleTronCard = () => {
    const dispatch = useDispatch();
    const analytics = useAnalytics();
    const isTronEnabled = useSelector(selectIsTronEnabled);

    const handleToggleTron = (value: boolean) => {
        dispatch(toggleIsTronEnabled());

        analytics.report({
            type: events.settingsToggleExperimentalFeatureEvent.name,
            payload: { feature: 'tron-view-only', value },
        });
    };

    return (
        <TouchableSwitchRow
            icon="coin"
            isChecked={isTronEnabled}
            onChange={handleToggleTron}
            text={<Translation id="moduleSettings.experimental.tronViewOnly.title" />}
            description={<Translation id="moduleSettings.experimental.tronViewOnly.description" />}
            accessibilityLabel="Tron toggle"
            testID="settings/tron-touchable-row"
        />
    );
};
