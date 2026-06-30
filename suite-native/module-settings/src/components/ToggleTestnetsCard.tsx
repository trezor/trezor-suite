import { useDispatch, useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { TouchableSwitchRow } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { selectAreTestnetsEnabled, toggleAreTestnetsEnabled } from '@suite-native/settings';

export const ToggleTestnetsCard = () => {
    const { translate } = useTranslate();
    const dispatch = useDispatch();
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const areTestnetsEnabled = useSelector(selectAreTestnetsEnabled);

    const handleToggleTestnets = (value: boolean) => {
        dispatch(toggleAreTestnetsEnabled());

        analytics.report({
            type: events.settingsToggleExperimentalFeatureEvent.name,
            payload: { feature: 'testnet-networks', value },
        });
    };

    return (
        <TouchableSwitchRow
            icon="coinSlash"
            isChecked={areTestnetsEnabled}
            onChange={handleToggleTestnets}
            text={<Translation id="moduleSettings.experimental.testnets.title" />}
            description={<Translation id="moduleSettings.experimental.testnets.description" />}
            accessibilityLabel={translate('moduleSettings.experimental.testnets.title')}
            testID="settings/testnets-touchable-row"
        />
    );
};
