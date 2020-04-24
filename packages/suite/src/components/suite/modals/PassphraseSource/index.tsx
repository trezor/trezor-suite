import React from 'react';
import { connect } from 'react-redux';
import { Modal } from '@trezor/components';
import { Translation } from '@suite-components/Translation';
import DeviceConfirmImage from '@suite-components/images/DeviceConfirmImage';
import * as discoveryActions from '@wallet-actions/discoveryActions';
import { Dispatch, TrezorDevice } from '@suite-types';

const mapDispatchToProps = (dispatch: Dispatch) => ({
    getDiscoveryAuthConfirmationStatus: () =>
        dispatch(discoveryActions.getDiscoveryAuthConfirmationStatus()),
});

type Props = {
    device: TrezorDevice;
} & ReturnType<typeof mapDispatchToProps>;

/**
 * Modal used with model T with legacy firmware as result of 'ButtonRequest_PassphraseType' where passphrase source is requested on device
 * @param {Props}
 */
const PassphraseSource = ({ device, getDiscoveryAuthConfirmationStatus }: Props) => {
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
        >
            <DeviceConfirmImage device={device} />
        </Modal>
    );
};

export default connect(null, mapDispatchToProps)(PassphraseSource);
