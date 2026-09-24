import { Translation } from '@suite/intl';
import { selectIsTestnetNetworksEnabled, suiteSettingsActions } from '@suite/settings';
import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { Switch } from '@trezor/components';
import { SectionItem } from '@trezor/product-components';

import { useSelector } from 'src/hooks/suite';

export const TestnetNetworks = () => {
    const { dispatch } = useServices(injectDispatch);
    const isEnabled = useSelector(selectIsTestnetNetworksEnabled);

    const handleSwitchChange = () => {
        dispatch(suiteSettingsActions.setIsTestnetNetworksEnabled(!isEnabled));
    };

    return (
        <SectionItem
            title={<Translation id="TR_EXPERIMENTAL_TESTNET_NETWORKS" />}
            description={<Translation id="TR_EXPERIMENTAL_TESTNET_NETWORKS_DESCRIPTION" />}
            actions={
                <Switch
                    isChecked={isEnabled}
                    onChange={handleSwitchChange}
                    data-testid="@settings/testnet-networks-switch"
                />
            }
        />
    );
};
