import { useIntl } from 'react-intl';

import { Translation, messages } from '@suite/intl';
import { Box, Modal } from '@trezor/components';
import TrezorConnect from '@trezor/connect';

import { ThpPairingCodeEntry } from './ThpPairingCodeEntry';

export const ThpPairingPinEntryModal = () => {
    const intl = useIntl();

    const onCancel = () => {
        TrezorConnect.cancel(intl.formatMessage(messages.TR_CANCELLED));
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
