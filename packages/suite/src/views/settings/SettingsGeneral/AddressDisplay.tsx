import { EventType } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { AddressDisplayOptions } from '@suite-common/wallet-types';
import { SelectBar } from '@trezor/components';

import { setAddressDisplayType } from 'src/actions/suite/suiteActions';
import { SettingsSectionItem } from 'src/components/settings/SettingsSectionItem';
import { ActionColumn, TextColumn } from 'src/components/suite';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useLegacyAnalytics } from 'src/support/useAnalytics';

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
    const legacyAnalytics = useLegacyAnalytics();
    const onChange = (value: AddressDisplayOptions) => {
        legacyAnalytics.report({
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
                    size="small"
                />
            </ActionColumn>
        </SettingsSectionItem>
    );
};
