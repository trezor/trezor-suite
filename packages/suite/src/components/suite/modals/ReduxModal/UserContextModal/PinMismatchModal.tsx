import { H3, NewModal } from '@trezor/components';

import { changePin } from 'src/actions/settings/deviceSettingsActions';
import { Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';

export const PinMismatchModal = () => {
    const dispatch = useDispatch();

    const onTryAgain = () => {
        dispatch(changePin({}));
    };

    return (
        <NewModal
            data-testid="@pin-mismatch"
            bottomContent={
                <NewModal.Button onClick={onTryAgain} data-testid="@pin-mismatch/try-again-button">
                    <Translation id="TR_TRY_AGAIN" />
                </NewModal.Button>
            }
            iconName="password"
            variant="warning"
            size="small"
        >
            <H3>
                <Translation id="TR_PIN_MISMATCH_HEADING" />
            </H3>
        </NewModal>
    );
};
