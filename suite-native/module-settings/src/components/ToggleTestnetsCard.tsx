import { useDispatch, useSelector } from 'react-redux';

import { TouchableSwitchRow } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { selectAreTestnetsEnabled, toggleAreTestnetsEnabled } from '@suite-native/settings';

export const ToggleTestnetsCard = () => {
    const dispatch = useDispatch();
    const areTestnetsEnabled = useSelector(selectAreTestnetsEnabled);

    const handleToggleTestnets = () => {
        dispatch(toggleAreTestnetsEnabled());
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
