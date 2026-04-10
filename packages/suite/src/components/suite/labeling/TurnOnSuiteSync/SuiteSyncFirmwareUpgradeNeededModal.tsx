import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { selectDeviceByStaticSessionId, selectDeviceLabelOrNameById } from '@suite-common/device';
import { Card, Modal, Paragraph } from '@trezor/components';
import { type StaticSessionId } from '@trezor/connect';

import { useDispatch, useSelector } from 'src/hooks/suite';

type SuiteSyncFirmwareUpgradeNeededModalProps = {
    onClose: () => void;
    deviceStaticSessionId: StaticSessionId | null;
};

export const SuiteSyncFirmwareUpgradeNeededModal = ({
    onClose,
    deviceStaticSessionId,
}: SuiteSyncFirmwareUpgradeNeededModalProps) => {
    const dispatch = useDispatch();

    const device = useSelector(state =>
        deviceStaticSessionId !== null
            ? selectDeviceByStaticSessionId(state, deviceStaticSessionId)
            : undefined,
    );

    const deviceLabel = useSelector(state =>
        device !== undefined ? selectDeviceLabelOrNameById(state, device.id) : null,
    );

    if (device === undefined) {
        return null;
    }

    const onClick = () => {
        // Update will disconnect device in the process and our Firmware Update
        // flow won't allow us to navigate back. So we just redirect the user
        // and close the modal.
        dispatch(goto({ routeName: 'firmware-index', params: { cancelable: true } }));
        onClose();
    };

    return (
        <Modal
            heading={<Translation id="TR_TURN_ON_SECURE_SYNC_FW_UPDATE_MODAL_HEADING" />}
            onCancel={onClose}
            width={600}
            bottomContent={
                <>
                    <Modal.Button onClick={onClick} intent="info">
                        <Translation id="TR_TURN_ON_SECURE_SYNC_FW_UPDATE_MODAL_UPGRADE" />
                    </Modal.Button>
                    <Modal.Button onClick={onClose} intent="neutral" priority="secondary">
                        <Translation id="TR_TURN_ON_SECURE_SYNC_FW_UPDATE_MODAL_NOT_NOW" />
                    </Modal.Button>
                </>
            }
        >
            <Card paddingType="large">
                <Paragraph intent="neutral" priority="secondary">
                    <Translation
                        id="TR_TURN_ON_SECURE_SYNC_FW_UPDATE_MODAL_DESCRIPTION"
                        values={{ name: deviceLabel }}
                    />
                </Paragraph>
            </Card>
        </Modal>
    );
};
