import React from 'react';
import styled from 'styled-components';
import { useDevice, useActions } from '@suite-hooks';
import * as receiveActions from '@wallet-actions/receiveActions';
import * as deviceSettingsActions from '@settings-actions/deviceSettingsActions';
import { Translation, Modal } from '@suite-components';
import { Button, Image } from '@trezor/components';
import { ExtendedMessageDescriptor } from '@suite-types';

const ImageWrapper = styled.div`
    padding: 60px 0;
`;

const StyledModal = styled(Modal)`
    width: 600px;
`;

type ConfirmUnverifiedAddressProps = {
    address: string;
    addressPath: string;
    onCancel: () => void;
};

export const ConfirmUnverifiedAddress = ({
    address,
    addressPath,
    onCancel,
}: ConfirmUnverifiedAddressProps) => {
    const { device, isLocked } = useDevice();
    const isDeviceLocked = isLocked();
    const { showAddress, showUnverifiedAddress, applySettings } = useActions({
        showAddress: receiveActions.showAddress,
        showUnverifiedAddress: receiveActions.showUnverifiedAddress,
        applySettings: deviceSettingsActions.applySettings,
    });

    // just to make TS happy
    if (!device) return null;

    const verifyAddress = async () => {
        if (!device.available) {
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

    let deviceStatus: ExtendedMessageDescriptor['id'] = 'TR_DEVICE_LABEL_IS_NOT_CONNECTED';
    let claim: ExtendedMessageDescriptor['id'] = 'TR_PLEASE_CONNECT_YOUR_DEVICE';
    let actionLabel: ExtendedMessageDescriptor['id'] = 'TR_TRY_VERIFYING_ON_DEVICE_AGAIN';

    // case where device is connected but it is unavailable because it was created with different "passphrase_protection" settings
    // TODO: doesn't work
    // right now revealing an address with different settings will cause toast notif error "Verify address error: passphrase is incorrect"

    if (device.connected && !device.available) {
        deviceStatus = 'TR_DEVICE_LABEL_IS_UNAVAILABLE';
        claim = 'TR_PLEASE_ENABLE_PASSPHRASE';
        actionLabel = 'TR_ACCOUNT_ENABLE_PASSPHRASE';
    }

    return (
        <StyledModal
            heading={<Translation id={deviceStatus} values={{ deviceLabel: device.label }} />}
            isCancelable
            onCancel={onCancel}
            description={
                <Translation
                    id="TR_TO_PREVENT_PHISHING_ATTACKS_COMMA"
                    values={{ claim: <Translation id={claim} /> }}
                />
            }
            bottomBar={
                <>
                    <Button variant="secondary" onClick={() => unverifiedAddress()}>
                        <Translation id="TR_SHOW_UNVERIFIED_ADDRESS" />
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => verifyAddress()}
                        isDisabled={isDeviceLocked}
                    >
                        <Translation id={actionLabel} />
                    </Button>
                </>
            }
        >
            <ImageWrapper>
                <Image image="UNI_ERROR" />
            </ImageWrapper>
        </StyledModal>
    );
};
