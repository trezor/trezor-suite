import { useCallback } from 'react';
import { useIntl } from 'react-intl';

import { messages } from '@suite/intl';
import { TrezorDevice } from '@suite-common/suite-types';
import TrezorConnect from '@trezor/connect';

import { ConfirmActionModal } from '../../../components/suite/modals/ReduxModal/DeviceContextModal/ConfirmActionModal';

type ThpPairingConfirmStepParams = {
    device: TrezorDevice;
};

export const ThpPairingConfirmStep = ({ device }: ThpPairingConfirmStepParams) => {
    const intl = useIntl();

    const abort = useCallback(
        () => TrezorConnect.cancel(intl.formatMessage(messages.TR_CANCELLED)),
        [intl],
    );

    return (
        <ConfirmActionModal
            device={device}
            title="TR_THP_SECURELY_CONNECT_WITH_TREZOR"
            onCancel={abort}
        />
    );
};
