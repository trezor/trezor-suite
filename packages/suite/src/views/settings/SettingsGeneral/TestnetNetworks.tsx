import { useDispatch } from 'react-redux';

import { Translation } from '@suite/intl';
import { selectIsTestnetNetworksEnabled, suiteSettingsActions } from '@suite/settings';
import { Switch } from '@trezor/components';
import { ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

import { useSelector } from 'src/hooks/suite';

export const TestnetNetworks = () => {
    const dispatch = useDispatch();
    const isEnabled = useSelector(selectIsTestnetNetworksEnabled);

    const handleSwitchChange = () => {
        dispatch(suiteSettingsActions.setIsTestnetNetworksEnabled(!isEnabled));
    };

    return (
        <SectionItem>
            <TextColumn
                title={<Translation id="TR_EXPERIMENTAL_TESTNET_NETWORKS" />}
                description={<Translation id="TR_EXPERIMENTAL_TESTNET_NETWORKS_DESCRIPTION" />}
            />
            <ActionColumn>
                <Switch
                    isChecked={isEnabled}
                    onChange={handleSwitchChange}
                    data-testid="@settings/testnet-networks-switch"
                />
            </ActionColumn>
        </SectionItem>
    );
};
