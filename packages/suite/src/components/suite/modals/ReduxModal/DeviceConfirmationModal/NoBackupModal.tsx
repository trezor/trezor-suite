import { Translation } from '@suite/intl';
import { onReceiveConfirmation } from '@suite/modal';
import { SettingsAnchor, goto } from '@suite/router';
import { useDispatch } from '@suite-common/redux-utils';
import { H2, Modal, Paragraph } from '@trezor/components';
import { WarningIcon } from '@trezor/icons';

export const NoBackupModal = () => {
    const dispatch = useDispatch();

    const confirm = () => dispatch(onReceiveConfirmation(true));
    const close = () => dispatch(onReceiveConfirmation(false));
    const goToSettings = () => {
        close();
        dispatch(goto({ routeName: 'settings-device', anchor: SettingsAnchor.BackupRecoverySeed }));
    };

    return (
        <Modal
            onCancel={close}
            icon={WarningIcon}
            intent="warning"
            width={600}
            bottomContent={
                <>
                    <Modal.Button onClick={confirm} data-testid="@no-backup/take-risk-button">
                        <Translation id="TR_CONTINUE_ANYWAY" />
                    </Modal.Button>
                    <Modal.Button intent="neutral" priority="secondary" onClick={goToSettings}>
                        <Translation id="TR_CREATE_BACKUP" />
                    </Modal.Button>
                </>
            }
        >
            <H2>
                <Translation id="TR_YOUR_TREZOR_IS_NOT_BACKED_UP" />
            </H2>
            <Paragraph margin={{ top: 12 }}>
                <Translation id="TR_IF_YOUR_DEVICE_IS_EVER_LOST" />
            </Paragraph>
        </Modal>
    );
};
