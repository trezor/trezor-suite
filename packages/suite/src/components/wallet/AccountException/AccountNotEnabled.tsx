import React from 'react';
import { Button } from '@trezor/components';
import * as walletSettingsActions from '@settings-actions/walletSettingsActions';
import { useDevice, useActions } from '@suite-hooks';
import { Network, Discovery } from '@wallet-types';
import { Translation, Image } from '@suite-components';

import Wrapper from './components/Wrapper';

interface Props {
    network: Network;
    discovery: Discovery;
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
        <Wrapper
            title={
                <Translation
                    id="TR_ACCOUNT_EXCEPTION_NOT_ENABLED"
                    values={{ networkName: network.name }}
                />
            }
            image={<Image image="EMPTY_WALLET" />}
        >
            <Button
                variant="primary"
                icon="PLUS"
                isLoading={isLocked()}
                onClick={() => changeCoinVisibility(network.symbol, true)}
            >
                <Translation id="TR_ENABLE_NETWORK_BUTTON" values={{ networkName: network.name }} />
            </Button>
        </Wrapper>
    );
};

export default AccountNotEnabled;
