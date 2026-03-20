import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { SettingsAnchor } from '@suite/router';
import { suiteSettingsActions } from '@suite/settings';
import { AddressDisplayOptions } from '@suite-common/wallet-types';
import { SelectBar } from '@trezor/components';

import { SettingsSectionItem } from 'src/components/settings/SettingsSectionItem';
import { ActionColumn, TextColumn } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

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
    const selectedAddressDisplay = useSelector(state => state.suiteSettings.addressDisplayType);
    const dispatch = useDispatch();
    const analytics = useAnalytics();
    const onChange = (value: AddressDisplayOptions) => {
        analytics.report({
            type: events.settingsGeneralAddressDisplayTypeEvent.name,
            payload: {
                addressDisplayType: value,
            },
        });
        dispatch(suiteSettingsActions.setAddressDisplayType(value));
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
