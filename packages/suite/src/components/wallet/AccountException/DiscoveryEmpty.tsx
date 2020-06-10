import React from 'react';
import { Button } from '@trezor/components';
import * as modalActions from '@suite-actions/modalActions';
import * as routerActions from '@suite-actions/routerActions';
import { useDevice, useActions } from '@suite-hooks';
import { Translation, Image } from '@suite-components';

import Wrapper from './components/Wrapper';

/**
 * Handler for invalid wallet setting, no coins in discovery
 * see: @wallet-actions/selectedAccountActions
 */
const DiscoveryEmpty = () => {
    const { device, isLocked } = useDevice();
    const { openModal, goto } = useActions({
        openModal: modalActions.openModal,
        goto: routerActions.goto,
    });

    const isDeviceLocked = isLocked();
    const isDisabled = !device || !device.connected || device.authFailed || device.authConfirm;
    return (
        <Wrapper
            title={<Translation id="TR_ACCOUNT_EXCEPTION_DISCOVERY_EMPTY" />}
            image={<Image image="EMPTY_WALLET" />}
            description={<Translation id="TR_ACCOUNT_EXCEPTION_DISCOVERY_EMPTY_DESC" />}
        >
            <Button
                variant="secondary"
                isLoading={isDeviceLocked}
                isDisabled={isDisabled}
                onClick={() => goto('settings-wallet')}
            >
                <Translation id="TR_COIN_SETTINGS" />
            </Button>
            <Button
                variant="primary"
                isLoading={isDeviceLocked}
                isDisabled={isDisabled}
                onClick={() =>
                    openModal({
                        type: 'add-account',
                        device: device!,
                    })
                }
            >
                <Translation id="TR_ADD_ACCOUNT" />
            </Button>
        </Wrapper>
    );
};

export default DiscoveryEmpty;
