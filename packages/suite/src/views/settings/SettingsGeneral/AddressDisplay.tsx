import { Translation } from 'src/components/suite/Translation';
import { SectionItem, ActionColumn, TextColumn } from 'src/components/suite/Settings';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { SettingsAnchor } from 'src/constants/suite/anchors';

import { SelectBar } from '@trezor/components';
import { AddressDisplayOptions } from 'src/reducers/suite/suiteReducer';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { EventType, analytics } from '@trezor/suite-analytics';
import { setDisplayAddress } from 'src/actions/suite/suiteActions';

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
    const selectedAddressDisplay = useSelector(state => state.suite.settings.addressDisplay);
    const dispatch = useDispatch();
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.AddressDisplay);

    const onChange = (value: AddressDisplayOptions) => {
        analytics.report({
            type: EventType.SettingsGeneralAddressDisplay,
            payload: {
                addressDisplay: value,
            },
        });
        dispatch(setDisplayAddress(value));
    };

    return (
        <SectionItem
            data-test="@settings/address-display"
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
