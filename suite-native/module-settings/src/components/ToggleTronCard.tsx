import { useDispatch, useSelector } from 'react-redux';

import { TouchableSwitchRow } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { selectIsTronEnabled, toggleIsTronEnabled } from '@suite-native/settings';

export const ToggleTronCard = () => {
    const dispatch = useDispatch();
    const isTronEnabled = useSelector(selectIsTronEnabled);

    const handleToggleTron = () => {
        dispatch(toggleIsTronEnabled());
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
