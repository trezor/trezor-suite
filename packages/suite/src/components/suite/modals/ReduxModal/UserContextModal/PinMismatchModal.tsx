import { Translation } from '@suite/intl';
import { H3, Modal } from '@trezor/components';

import { changePin } from 'src/actions/settings/deviceSettingsActions';
import { useDispatch } from 'src/hooks/suite';

export const PinMismatchModal = () => {
    const dispatch = useDispatch();

    const onTryAgain = () => {
        dispatch(changePin({}));
    };

    return (
        <Modal
            data-testid="@pin-mismatch"
            bottomContent={
                <Modal.Button onClick={onTryAgain} data-testid="@pin-mismatch/try-again-button">
                    <Translation id="TR_TRY_AGAIN" />
                </Modal.Button>
            }
            iconName="password"
            intent="warning"
            width={600}
        >
            <H3>
                <Translation id="TR_PIN_MISMATCH_HEADING" />
            </H3>
        </Modal>
    );
};
