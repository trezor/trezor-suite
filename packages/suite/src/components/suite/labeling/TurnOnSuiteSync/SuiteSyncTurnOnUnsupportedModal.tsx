import { Translation } from '@suite/intl';
import { selectDeviceByStaticSessionId, selectDeviceLabelOrNameById } from '@suite-common/device';
import { Card, Modal, Paragraph } from '@trezor/components';
import { StaticSessionId } from '@trezor/connect';
import { TREZOR_URL } from '@trezor/urls';

import { useSelector } from '../../../../hooks/suite';

type SuiteSyncTurnOnAndFwUpgradeModalProps = {
    onClose: () => void;
    deviceStaticSessionId: StaticSessionId;
};

export const SuiteSyncTurnOnUnsupportedModal = ({
    onClose,
    deviceStaticSessionId,
}: SuiteSyncTurnOnAndFwUpgradeModalProps) => {
    const device = useSelector(state =>
        deviceStaticSessionId !== null
            ? selectDeviceByStaticSessionId(state, deviceStaticSessionId)
            : undefined,
    );

    const deviceLabel = useSelector(state =>
        device !== undefined ? selectDeviceLabelOrNameById(state, device.id) : null,
    );

    return (
        <Modal
            heading={<Translation id="TR_TURN_ON_SECURE_SYNC_LABELS_MODAL_HEADING" />}
            description={<Translation id="TR_TURN_ON_SECURE_SYNC_LABELS_MODAL_DESCRIPTION" />}
            onCancel={onClose}
            width={600}
            bottomContent={
                <>
                    <Modal.Button onClick={onClose}>
                        <Translation id="FIRMWARE_UNSUPPORTED_DEVICE_SUITE_SYNC_GOT_IT" />
                    </Modal.Button>
                    <Modal.Button
                        href={TREZOR_URL}
                        onClick={onClose}
                        intent="neutral"
                        priority="secondary"
                    >
                        <Translation id="FIRMWARE_UNSUPPORTED_DEVICE_SUITE_SYNC_BUY" />
                    </Modal.Button>
                </>
            }
        >
            <Card paddingType="large">
                <Paragraph>
                    <Translation
                        id="FIRMWARE_UNSUPPORTED_DEVICE_SUITE_SYNC"
                        values={{ name: deviceLabel }}
                    />
                </Paragraph>
            </Card>
        </Modal>
    );
};
