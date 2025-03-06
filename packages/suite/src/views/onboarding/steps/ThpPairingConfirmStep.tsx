import { useCallback } from 'react';
import { useIntl } from 'react-intl';

import { TrezorDevice } from '@suite-common/suite-types';
import TrezorConnect from '@trezor/connect';

import { ConfirmActionModal } from '../../../components/suite/modals';
import messages from '../../../support/messages';

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
