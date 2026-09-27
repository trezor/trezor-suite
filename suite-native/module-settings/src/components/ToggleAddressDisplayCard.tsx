import { useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { selectAddressDisplayType, setAddressDisplayType } from '@suite-common/wallet-core';
import { AddressDisplayOptions } from '@suite-common/wallet-types';
import { TouchableSwitchRow } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';

export const ToggleAddressDisplayCard = () => {
    const { translate } = useTranslate();
    const addressDisplayType = useSelector(selectAddressDisplayType);
    const { dispatch } = useServices(injectDispatch);

    const handleToggle = (value: boolean) => {
        dispatch(
            setAddressDisplayType(
                value ? AddressDisplayOptions.CHUNKED : AddressDisplayOptions.ORIGINAL,
            ),
        );
    };

    return (
        <TouchableSwitchRow
            accessibilityLabel={translate('moduleSettings.advanced.addressDisplay.title')}
            isChecked={addressDisplayType === AddressDisplayOptions.CHUNKED}
            onChange={handleToggle}
            text={<Translation id="moduleSettings.advanced.addressDisplay.title" />}
            description={<Translation id="moduleSettings.advanced.addressDisplay.subtitle" />}
            icon="slideshow"
        />
    );
};
