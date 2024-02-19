import { Translation } from 'src/components/suite/Translation';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { SettingsAnchor } from 'src/constants/suite/anchors';

import { SelectBar } from '@trezor/components';
import { AddressDisplayOptions } from 'src/reducers/suite/suiteReducer';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { EventType, analytics } from '@trezor/suite-analytics';
import { setAddressDisplayType } from 'src/actions/suite/suiteActions';
import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';

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
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.AddressDisplay);

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
        <SectionItem
            data-test-id="@settings/address-display"
            ref={anchorRef}
            shouldHighlight={shouldHighlight}
        >
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
        </SectionItem>
    );
};
