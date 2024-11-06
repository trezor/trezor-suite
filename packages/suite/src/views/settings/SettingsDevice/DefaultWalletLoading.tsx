import { WalletType as DefaultWalletLoadingOptions } from '@suite-common/wallet-types';
import { SelectBar } from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';
import { deviceActions, selectDevice } from '@suite-common/wallet-core';

import { Translation } from 'src/components/suite/Translation';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { setDefaultWalletLoading } from 'src/actions/suite/suiteActions';
import { SettingsSectionItem } from 'src/components/settings';
import { ActionColumn, TextColumn } from 'src/components/suite';

const options = [
    {
        label: <Translation id="TR_DEFAULT_WALLET_LOADING_STANDARD" />,
        value: DefaultWalletLoadingOptions.STANDARD,
    },
    {
        label: <Translation id="TR_DEFAULT_WALLET_LOADING_PASSPHRASE" />,
        value: DefaultWalletLoadingOptions.PASSPHRASE,
    },
];

export const DefaultWalletLoading = () => {
    const device = useSelector(selectDevice);
    const selectedAddressDisplay = useSelector(state => state.suite.settings.defaultWalletLoading);
    const dispatch = useDispatch();

    if (device === undefined) {
        return null;
    }

    const onChange = (value: DefaultWalletLoadingOptions) => {
        analytics.report({
            type: EventType.SettingsDeviceDefaultWalletLoading,
            payload: { defaultWalletLoading: value },
        });

        dispatch(setDefaultWalletLoading(value));

        if (device.state === undefined) {
            dispatch(
                deviceActions.updatePassphraseMode({
                    device,
                    hidden: value === DefaultWalletLoadingOptions.PASSPHRASE,
                }),
            );
        }
    };

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.DefaultWalletLoading}>
            <TextColumn
                title={<Translation id="TR_DEVICE_SETTINGS_DEFAULT_WALLET_LOADING_TITLE" />}
                description={<Translation id="TR_DEVICE_SETTINGS_DEFAULT_WALLET_LOADING_DESC" />}
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
