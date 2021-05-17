import React from 'react';
import { Button, Tooltip, ButtonProps } from '@trezor/components';
import { Translation } from '@suite-components';
import { TrezorDevice } from '@suite-types';
import { useActions, useDiscovery } from '@suite-hooks';
import { DISCOVERY } from '@wallet-actions/constants';
import * as modalActions from '@suite-actions/modalActions';

interface Props extends ButtonProps {
    device: TrezorDevice | undefined;
    noButtonLabel?: boolean;
    closeMenu?: () => void;
}

const getExplanationMessage = (device: TrezorDevice | undefined, discoveryIsRunning: boolean) => {
    let message;
    if (device && !device.connected) {
        message = <Translation id="TR_TO_ADD_NEW_ACCOUNT_PLEASE_CONNECT" />;
    } else if (discoveryIsRunning) {
        message = <Translation id="TR_TO_ADD_NEW_ACCOUNT_WAIT_FOR_DISCOVERY" />;
    }
    return message;
};

const AddAccountButton = ({ device, isDisabled, noButtonLabel, closeMenu, ...rest }: Props) => {
    const { discovery } = useDiscovery();
    const { openModal } = useActions({
        openModal: modalActions.openModal,
    });
    const discoveryIsRunning = discovery ? discovery.status <= DISCOVERY.STATUS.STOPPING : false;

    // TODO: add more cases when adding account is not possible
    const addAccountDisabled =
        discoveryIsRunning ||
        !device ||
        !device.connected ||
        device.authConfirm ||
        device.authFailed;

    const tooltipMessage = getExplanationMessage(device, discoveryIsRunning);

    const ButtonComponent = (
        <Button
            onClick={
                device
                    ? () => {
                          openModal({
                              type: 'add-account',
                              device,
                          });
                          if (closeMenu) closeMenu();
                      }
                    : undefined
            }
            icon="PLUS"
            variant="secondary"
            isDisabled={addAccountDisabled || isDisabled}
            {...rest}
        >
            {!noButtonLabel && <Translation id="TR_ADD_ACCOUNT" />}
        </Button>
    );

    if (tooltipMessage) {
        return (
            <Tooltip maxWidth={200} offset={50} content={tooltipMessage} placement="bottom">
                {ButtonComponent}
            </Tooltip>
        );
    }
    return ButtonComponent;
};

export default AddAccountButton;
