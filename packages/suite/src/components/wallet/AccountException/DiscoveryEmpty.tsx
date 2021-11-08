import React from 'react';
import * as modalActions from '@suite-actions/modalActions';
import * as routerActions from '@suite-actions/routerActions';
import { useDevice, useActions } from '@suite-hooks';
import { Translation } from '@suite-components';
import { AccountExceptionLayout } from '@wallet-components';

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
        <AccountExceptionLayout
            title={<Translation id="TR_ACCOUNT_EXCEPTION_DISCOVERY_EMPTY" />}
            image="CLOUDY"
            description={<Translation id="TR_ACCOUNT_EXCEPTION_DISCOVERY_EMPTY_DESC" />}
            actions={[
                {
                    key: '1',
                    variant: 'secondary',
                    isLoading: isDeviceLocked,
                    isDisabled,
                    onClick: () => goto('settings-coins'),
                    children: <Translation id="TR_COIN_SETTINGS" />,
                },
                {
                    key: '2',
                    isLoading: isDeviceLocked,
                    isDisabled,
                    onClick: () =>
                        openModal({
                            type: 'add-account',
                            device: device!,
                        }),
                    children: <Translation id="TR_ADD_ACCOUNT" />,
                },
            ]}
        />
    );
};

export default DiscoveryEmpty;
