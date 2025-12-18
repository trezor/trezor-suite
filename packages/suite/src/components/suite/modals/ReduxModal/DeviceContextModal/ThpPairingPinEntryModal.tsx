import { useIntl } from 'react-intl';

import { thpActions } from '@suite-common/thp';
import { Box, Modal } from '@trezor/components';
import TrezorConnect from '@trezor/connect';

import { useDispatch } from '../../../../../hooks/suite';
import messages from '../../../../../support/messages';
import { ThpPairingCodeEntry } from '../../../../connection/thp/ThpPairingCodeEntry';
import { Translation } from '../../../Translation';

export const ThpPairingPinEntryModal = () => {
    const intl = useIntl();
    const dispatch = useDispatch();

    const onCancel = () => {
        TrezorConnect.cancel(intl.formatMessage(messages.TR_CANCELLED));
        dispatch(thpActions.finishThpFlow());
    };

    return (
        <Modal
            onCancel={onCancel}
            isBackdropCancelable={false}
            width={600}
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
