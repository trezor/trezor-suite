import React from 'react';
import { connect } from 'react-redux';
import { ConfirmOnDevice } from '@trezor/components';
import { Modal, ModalProps } from '@suite-components';
import { Translation } from '@suite-components/Translation';
import * as discoveryActions from '@wallet-actions/discoveryActions';
import { Dispatch, TrezorDevice } from '@suite-types';

import DeviceConfirmImage from '@suite-components/images/DeviceConfirmImage';

const mapDispatchToProps = (dispatch: Dispatch) => ({
    getDiscoveryAuthConfirmationStatus: () =>
        dispatch(discoveryActions.getDiscoveryAuthConfirmationStatus()),
});

interface OwnProps extends ModalProps {
    device: TrezorDevice;
}

type Props = OwnProps & ReturnType<typeof mapDispatchToProps>;

/**
 * Modal used with model T with legacy firmware as result of 'ButtonRequest_PassphraseType' where passphrase source is requested on device
 * @param {Props}
 */
const PassphraseOnDevice = ({ device, getDiscoveryAuthConfirmationStatus, ...rest }: Props) => {
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

export default connect(null, mapDispatchToProps)(PassphraseOnDevice);
