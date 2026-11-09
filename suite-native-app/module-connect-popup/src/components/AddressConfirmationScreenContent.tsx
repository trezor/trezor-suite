import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { selectConnectPopupCall } from '@suite-common/connect-popup';
import { Box } from '@suite-native/atoms';
import {
    ConfirmOnTrezorWrapper,
    useConfirmOnTrezorController,
} from '@suite-native/confirm-on-trezor';
import { DeviceManager } from '@suite-native/device-manager';

import { AddressConfirmation } from './AddressConfirmation';

export const AddressConfirmationScreenContent = () => {
    const popupCall = useSelector(selectConnectPopupCall);
    const { confirmOnTrezorRef, revealConfirmOnTrezorSheet, closeSheet } =
        useConfirmOnTrezorController();

    const isVerifyingOnDevice =
        popupCall?.state === 'address-confirmation' &&
        popupCall.addresses.some(({ loading }) => loading);

    useEffect(() => {
        if (isVerifyingOnDevice) {
            revealConfirmOnTrezorSheet();
        } else {
            closeSheet();
        }
    }, [isVerifyingOnDevice, revealConfirmOnTrezorSheet, closeSheet]);

    return (
        <ConfirmOnTrezorWrapper
            isManualControlEnabled
            isCloseButtonDisabled
            controlRef={confirmOnTrezorRef}
        >
            <Box>
                <DeviceManager />
            </Box>
            <Box paddingTop="sp16" flex={1}>
                <AddressConfirmation />
            </Box>
        </ConfirmOnTrezorWrapper>
    );
};
