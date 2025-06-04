import { useIntl } from 'react-intl';

import { thpActions } from '@suite-common/thp';
import { Flex, Modal } from '@trezor/components';
import TrezorConnect from '@trezor/connect';
import { spacings } from '@trezor/theme';

import { useDispatch } from '../../../../../hooks/suite';
import messages from '../../../../../support/messages';
import { ThpPairingCodeEntry } from '../../../../thp/ThpPairingCodeEntry';
import { Translation } from '../../../Translation';

export const ThpPairingPinEntryModal = () => {
    const intl = useIntl();
    const dispatch = useDispatch();

    const onCancel = () => {
        TrezorConnect.cancel(intl.formatMessage(messages.TR_CANCELLED));
        dispatch(thpActions.resetThpFlow());
    };

    return (
        <Modal
            onCancel={onCancel}
            size="small"
            data-testid="@modal/thp-paring"
            heading={<Translation id="TR_THP_ENTER_ONE_TIME_CODE" />}
            description={<Translation id="TR_THP_CHECK_TREZOR_FOR_CODE" />}
        >
            <Flex margin={{ bottom: spacings.xxxxl, top: spacings.xxl }}>
                <ThpPairingCodeEntry />
            </Flex>
        </Modal>
    );
};
