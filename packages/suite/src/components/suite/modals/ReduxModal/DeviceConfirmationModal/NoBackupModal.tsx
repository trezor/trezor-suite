import styled from 'styled-components';

import { onReceiveConfirmation } from 'src/actions/suite/modalActions';
import { goto } from 'src/actions/suite/routerActions';
import { Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite/useDispatch';
import { Button } from '@trezor/components';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { DialogModal } from '../../Modal/DialogRenderer';

const StyledModal = styled(DialogModal)`
    width: 600px;
`;

export const NoBackupModal = () => {
    const dispatch = useDispatch();

    const confirm = () => dispatch(onReceiveConfirmation(true));
    const close = () => dispatch(onReceiveConfirmation(false));
    const goToSettings = () => {
        close();
        dispatch(goto('settings-device', { anchor: SettingsAnchor.BackupRecoverySeed }));
    };

    return (
        <StyledModal
            isCancelable
            onCancel={close}
            icon="warningTriangleLight"
            bodyHeading={<Translation id="TR_YOUR_TREZOR_IS_NOT_BACKED_UP" />}
            text={<Translation id="TR_IF_YOUR_DEVICE_IS_EVER_LOST" />}
            bottomBarComponents={
                <>
                    <Button
                        variant="destructive"
                        onClick={confirm}
                        data-test="@no-backup/take-risk-button"
                    >
                        <Translation id="TR_CONTINUE_ANYWAY" />
                    </Button>
                    <Button onClick={goToSettings}>
                        <Translation id="TR_CREATE_BACKUP" />
                    </Button>
                </>
            }
        />
    );
};
