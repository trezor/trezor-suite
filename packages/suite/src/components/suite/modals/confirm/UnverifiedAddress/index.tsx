import React from 'react';
import styled from 'styled-components';
import { useDevice, useActions } from '@suite-hooks';
import * as receiveActions from '@wallet-actions/receiveActions';
import * as deviceSettingsActions from '@settings-actions/deviceSettingsActions';
import { Translation, Image } from '@suite-components';
import { Button, Modal } from '@trezor/components';
import { TrezorDevice, ExtendedMessageDescriptor } from '@suite-types';

const ImageWrapper = styled.div`
    padding: 60px 0px;
`;

const Actions = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
`;

type Props = {
    device: TrezorDevice;
    address: string;
    addressPath: string;
    onCancel: () => void;
};

const ConfirmUnverifiedAddress = ({ device, address, addressPath, onCancel }: Props) => {
    const { isLocked } = useDevice();
    const isDeviceLocked = isLocked();
    const { showAddress, showUnverifiedAddress, applySettings } = useActions({
        showAddress: receiveActions.showAddress,
        showUnverifiedAddress: receiveActions.showUnverifiedAddress,
        applySettings: deviceSettingsActions.applySettings,
    });
    const verifyAddress = async () => {
        if (!device.available) {
            // eslint-disable-next-line @typescript-eslint/camelcase
            const result = await applySettings({ use_passphrase: true });
            if (!result || !result.success) return;
        }
        onCancel();
        showAddress(addressPath, address);
    };

    const unverifiedAddress = () => {
        onCancel();
        showUnverifiedAddress(addressPath, address);
    };

    let deviceStatus: ExtendedMessageDescriptor['id'];
    let claim: ExtendedMessageDescriptor['id'];
    let actionLabel: ExtendedMessageDescriptor['id'];

    if (!device.connected) {
        deviceStatus = 'TR_DEVICE_LABEL_IS_NOT_CONNECTED';
        claim = 'TR_PLEASE_CONNECT_YOUR_DEVICE';
        actionLabel = 'TR_TRY_AGAIN';
    } else {
        // case where device is connected but it is unavailable because it was created with different "passphrase_protection" settings
        deviceStatus = 'TR_DEVICE_LABEL_IS_UNAVAILABLE';
        claim = 'TR_PLEASE_ENABLE_PASSPHRASE';
        actionLabel = 'TR_ACCOUNT_ENABLE_PASSPHRASE';
    }

    return (
        <Modal
            heading={<Translation id={deviceStatus} values={{ deviceLabel: device.label }} />}
            cancelable
            size="small"
            onCancel={onCancel}
            description={
                <Translation
                    id="TR_TO_PREVENT_PHISHING_ATTACKS_COMMA"
                    values={{ claim: <Translation id={claim} /> }}
                />
            }
        >
            <ImageWrapper>
                <Image image="UNI_ERROR" />
            </ImageWrapper>
            <Actions>
                <Button
                    variant="secondary"
                    onClick={() => unverifiedAddress()}
                    isLoading={isDeviceLocked}
                    isDisabled={isDeviceLocked}
                >
                    <Translation id="TR_SHOW_UNVERIFIED_ADDRESS" />
                </Button>
                <Button
                    variant="primary"
                    onClick={() => verifyAddress()}
                    isLoading={isDeviceLocked}
                    isDisabled={isDeviceLocked}
                >
                    <Translation id={actionLabel} />
                </Button>
            </Actions>
        </Modal>
    );
};

export default ConfirmUnverifiedAddress;
