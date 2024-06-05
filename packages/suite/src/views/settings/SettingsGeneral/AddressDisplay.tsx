import { AddressDisplayOptions } from '@suite-common/wallet-types';
import { SelectBar } from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';

import { Translation } from 'src/components/suite/Translation';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { setAddressDisplayType } from 'src/actions/suite/suiteActions';
import { SettingsSectionItem } from 'src/components/settings';
import { ActionColumn, TextColumn } from 'src/components/suite';

const options = [
    {
        label: <Translation id="TR_ORIGINAL_ADDRESS" />,
        value: AddressDisplayOptions.ORIGINAL,
    },
    {
        label: <Translation id="TR_CHUNKED_ADDRESS" />,
        value: AddressDisplayOptions.CHUNKED,
    },
];

export const AddressDisplay = () => {
    const selectedAddressDisplay = useSelector(state => state.suite.settings.addressDisplayType);
    const dispatch = useDispatch();

    const onChange = (value: AddressDisplayOptions) => {
        analytics.report({
            type: EventType.SettingsGeneralAddressDisplayType,
            payload: {
                addressDisplayType: value,
            },
        });
        dispatch(setAddressDisplayType(value));
    };

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.AddressDisplay}>
            <TextColumn
                title={<Translation id="TR_ADDRESS_DISPLAY" />}
                description={<Translation id="TR_ADDRESS_DISPLAY_DESCRIPTION" />}
            />
            <ActionColumn>
                <SelectBar
                    selectedOption={selectedAddressDisplay}
                    options={options}
                    onChange={onChange}
                />
            </ActionColumn>
        </SettingsSectionItem>
    );
};
