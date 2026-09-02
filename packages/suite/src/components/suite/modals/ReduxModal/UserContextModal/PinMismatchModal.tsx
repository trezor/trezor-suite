import { Translation } from '@suite/intl';
import { useDispatch } from '@suite-common/redux-utils';
import { H3, Modal } from '@trezor/components';
import { PasswordIcon } from '@trezor/icons';

import { changePinThunk } from 'src/actions/settings/deviceSettingsActions';

export const PinMismatchModal = () => {
    const dispatch = useDispatch();

    const onTryAgain = () => {
        dispatch(changePinThunk({}));
    };

    return (
        <Modal
            data-testid="@pin-mismatch"
            bottomContent={
                <Modal.Button onClick={onTryAgain} data-testid="@pin-mismatch/try-again-button">
                    <Translation id="TR_TRY_AGAIN" />
                </Modal.Button>
            }
            icon={PasswordIcon}
            intent="warning"
            width={600}
        >
            <H3>
                <Translation id="TR_PIN_MISMATCH_HEADING" />
            </H3>
        </Modal>
    );
};
