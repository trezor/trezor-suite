import React from 'react';
import { ConfirmOnDevice } from '@trezor/components';
import { Modal } from '@suite-components';
import { Translation } from '@suite-components/Translation';
import DeviceConfirmImage from '@suite-components/images/DeviceConfirmImage';
import { useActions } from '@suite-hooks';
import * as discoveryActions from '@wallet-actions/discoveryActions';
import type { TrezorDevice } from '@suite-types';

interface Props {
    device: TrezorDevice;
}

/**
 * Modal used with model T with legacy firmware as result of 'ButtonRequest_PassphraseType' where passphrase source is requested on device
 * @param {Props}
 */
const PassphraseSource = ({ device, ...rest }: Props) => {
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
                        id="TR_CONFIRM_PASSPHRASE_SOURCE"
                        values={{ deviceLabel: device.label }}
                    />
                }
                data-test="@modal/confirm-empty-hidden-wallet"
                {...rest}
            >
                <DeviceConfirmImage device={device} />
            </Modal>
        );
    }

    return (
        <Modal
            size="tiny"
            heading={
                <Translation
                    id="TR_SELECT_PASSPHRASE_SOURCE"
                    values={{ deviceLabel: device.label }}
                />
            }
            header={
                <ConfirmOnDevice
                    title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                    trezorModel={device.features?.major_version === 1 ? 1 : 2}
                    animated
                />
            }
            data-test="@modal/passphrase-source"
            {...rest}
        >
            <DeviceConfirmImage device={device} />
        </Modal>
    );
};

export default PassphraseSource;
