import { useDispatch, useSelector } from 'react-redux';

import { selectAddressDisplayType, setAddressDisplayType } from '@suite-common/wallet-core';
import { AddressDisplayOptions } from '@suite-common/wallet-types';
import { TouchableSwitchRow } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export const ToggleAddressDisplayCard = () => {
    const addressDisplayType = useSelector(selectAddressDisplayType);
    const dispatch = useDispatch();

    const handleToggle = (value: boolean) => {
        dispatch(
            setAddressDisplayType(
                value ? AddressDisplayOptions.CHUNKED : AddressDisplayOptions.ORIGINAL,
            ),
        );
    };

    return (
        <TouchableSwitchRow
            isChecked={addressDisplayType === AddressDisplayOptions.CHUNKED}
            onChange={handleToggle}
            text={<Translation id="moduleSettings.advanced.addressDisplay.title" />}
            description={<Translation id="moduleSettings.advanced.addressDisplay.subtitle" />}
            icon="slideshow"
        />
    );
};
