import React from 'react';
import { ConfirmOnDevice } from '@trezor/components';
import { Modal } from '@suite-components';
import { Translation } from '@suite-components/Translation';
import { useActions } from '@suite-hooks';
import * as discoveryActions from '@wallet-actions/discoveryActions';
import DeviceConfirmImage from '@suite-components/images/DeviceConfirmImage';
import type { TrezorDevice } from '@suite-types';

interface Props {
    device: TrezorDevice;
}

/**
 * Modal used with model T with legacy firmware as result of 'ButtonRequest_PassphraseType' where passphrase source is requested on device
 * @param {Props}
 */
const PassphraseOnDevice = ({ device, ...rest }: Props) => {
    const { getDiscoveryAuthConfirmationStatus } = useActions({
        getDiscoveryAuthConfirmationStatus: discoveryActions.getDiscoveryAuthConfirmationStatus,
    });
    const authConfirmation = getDiscoveryAuthConfirmationStatus() || device.authConfirm;

    if (authConfirmation) {
        return (
            <Modal
                size="tiny"
                heading={
                    <Translation
                        id="TR_CONFIRM_EMPTY_HIDDEN_WALLET_ON"
                        values={{ deviceLabel: device.label }}
                    />
                }
                description={<Translation id="TR_THIS_HIDDEN_WALLET_IS_EMPTY_SOURCE" />}
                {...rest}
            >
                <DeviceConfirmImage device={device} />
                {/* TODO: similar text is in Passphrase modal */}
            </Modal>
        );
    }

    return (
        <Modal
            size="tiny"
            heading={
                <Translation
                    id="TR_ENTER_PASSPHRASE_ON_DEVICE_LABEL"
                    values={{ deviceLabel: device.label }}
                />
            }
            header={
                <ConfirmOnDevice
                    title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                    trezorModel={device.features?.major_version === 1 ? 1 : 2}
                />
            }
            description={<Translation id="TR_PASSPHRASE_CASE_SENSITIVE" />}
            data-test="@modal/enter-passphrase-on-device"
            {...rest}
        >
            <DeviceConfirmImage device={device} />
        </Modal>
    );
};

export default PassphraseOnDevice;
