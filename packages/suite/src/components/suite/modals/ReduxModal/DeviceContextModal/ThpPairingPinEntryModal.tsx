import { useIntl } from 'react-intl';

import { TrezorDevice } from '@suite-common/suite-types';
import { thpActions } from '@suite-common/thp';
import { Box, Modal } from '@trezor/components';
import TrezorConnect from '@trezor/connect';

import { useDispatch } from '../../../../../hooks/suite';
import messages from '../../../../../support/messages';
import { ThpPairingCodeEntry } from '../../../../connection/thp/ThpPairingCodeEntry';
import { Translation } from '../../../Translation';

type ThpPairingPinEntryModalParams = {
    device: TrezorDevice;
};

export const ThpPairingPinEntryModal = ({ device }: ThpPairingPinEntryModalParams) => {
    const intl = useIntl();
    const dispatch = useDispatch();

    const onCancel = () => {
        TrezorConnect.cancel(intl.formatMessage(messages.TR_CANCELLED));
        dispatch(thpActions.finishThpFlow({ path: device.path }));
    };

    return (
        <Modal
            onCancel={onCancel}
            isBackdropCancelable={false}
            size="small"
            data-testid="@modal/thp-paring"
            heading={<Translation id="TR_THP_ENTER_ONE_TIME_CODE" />}
            description={<Translation id="TR_THP_CHECK_TREZOR_FOR_CODE" />}
        >
            <Box margin={{ top: 24, bottom: 4 }}>
                <ThpPairingCodeEntry />
            </Box>
        </Modal>
    );
};
