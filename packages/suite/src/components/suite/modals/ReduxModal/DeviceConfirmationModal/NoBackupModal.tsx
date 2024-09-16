import { onReceiveConfirmation } from 'src/actions/suite/modalActions';
import { goto } from 'src/actions/suite/routerActions';
import { Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite/useDispatch';
import { NewModal, Paragraph, H2 } from '@trezor/components';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { spacings } from '@trezor/theme';

export const NoBackupModal = () => {
    const dispatch = useDispatch();

    const confirm = () => dispatch(onReceiveConfirmation(true));
    const close = () => dispatch(onReceiveConfirmation(false));
    const goToSettings = () => {
        close();
        dispatch(goto('settings-device', { anchor: SettingsAnchor.BackupRecoverySeed }));
    };

    return (
        <NewModal
            onCancel={close}
            icon="warning"
            variant="warning"
            size="small"
            bottomContent={
                <>
                    <NewModal.Button onClick={confirm} data-testid="@no-backup/take-risk-button">
                        <Translation id="TR_CONTINUE_ANYWAY" />
                    </NewModal.Button>
                    <NewModal.Button variant="tertiary" onClick={goToSettings}>
                        <Translation id="TR_CREATE_BACKUP" />
                    </NewModal.Button>
                </>
            }
        >
            <H2>
                <Translation id="TR_YOUR_TREZOR_IS_NOT_BACKED_UP" />
            </H2>
            <Paragraph margin={{ top: spacings.sm }}>
                <Translation id="TR_IF_YOUR_DEVICE_IS_EVER_LOST" />
            </Paragraph>
        </NewModal>
    );
};
