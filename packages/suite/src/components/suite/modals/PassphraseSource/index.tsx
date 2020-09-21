import React from 'react';
import { connect } from 'react-redux';
import { ConfirmOnDevice, Modal, ModalProps } from '@trezor/components';
import { Translation } from '@suite-components/Translation';
import DeviceConfirmImage from '@suite-components/images/DeviceConfirmImage';
import * as discoveryActions from '@wallet-actions/discoveryActions';
import { Dispatch, TrezorDevice } from '@suite-types';

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
const PassphraseSource = ({ device, getDiscoveryAuthConfirmationStatus, ...rest }: Props) => {
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
            {...rest}
        >
            <DeviceConfirmImage device={device} />
        </Modal>
    );
};

export default connect(null, mapDispatchToProps)(PassphraseSource);
