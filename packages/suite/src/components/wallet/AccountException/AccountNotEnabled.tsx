import React from 'react';
import * as walletSettingsActions from '@settings-actions/walletSettingsActions';
import { useDevice, useActions } from '@suite-hooks';
import { Network } from '@wallet-types';
import { Translation } from '@suite-components';
import { AccountExceptionLayout } from '@wallet-components';

interface Props {
    network: Network;
}

/**
 * Handler for invalid router params, coin is not enabled in settings
 * see: @wallet-actions/selectedAccountActions
 */
const AccountNotEnabled = (props: Props) => {
    const { network } = props;
    const { isLocked } = useDevice();
    const { changeCoinVisibility } = useActions({
        changeCoinVisibility: walletSettingsActions.changeCoinVisibility,
    });

    return (
        <AccountExceptionLayout
            title={
                <Translation
                    id="TR_ACCOUNT_EXCEPTION_NOT_ENABLED"
                    values={{ networkName: network.name }}
                />
            }
            image="CLOUDY"
            actions={[
                {
                    icon: 'PLUS',
                    key: '1',
                    isLoading: isLocked(),
                    onClick: () => changeCoinVisibility(network.symbol, true),
                    children: (
                        <Translation
                            id="TR_ENABLE_NETWORK_BUTTON"
                            values={{ networkName: network.name }}
                        />
                    ),
                },
            ]}
        />
    );
};

export default AccountNotEnabled;
