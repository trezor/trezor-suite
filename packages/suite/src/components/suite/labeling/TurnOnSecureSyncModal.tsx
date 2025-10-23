import { labelingActions } from '@suite-common/local-first-storage';
import { Card, List, Modal, Paragraph } from '@trezor/components';

import { useDispatch } from 'src/hooks/suite';
import { useLabelingCombined } from 'src/hooks/suite/useLabelingCombined';

import { Translation } from '../Translation';

type TurnOnSecureSyncModalProps = {
    onClose: () => void;
};

export const TurnOnSecureSyncModal = ({ onClose }: TurnOnSecureSyncModalProps) => {
    const dispatch = useDispatch();
    const { localFirstEnableIfNeeded } = useLabelingCombined({ deviceStaticSessionId: undefined });

    const onSwitch = () => {
        localFirstEnableIfNeeded();
        dispatch(labelingActions.updateshowLocalFirstStorage({ isShownInSettings: false }));
    };

    return (
        <Modal
            heading={<Translation id="TR_TURN_ON_SECURE_SYNC_LABELS_MODAL_HEADING" />}
            description={<Translation id="TR_TURN_ON_SECURE_SYNC_LABELS_MODAL_DESCRIPTION" />}
            onCancel={onClose}
            bottomContent={
                <>
                    <Modal.Button onClick={onSwitch}>
                        <Translation id="TR_TURN_ON_SECURE_SYNC" />
                    </Modal.Button>
                    <Modal.Button onClick={onClose} variant="tertiary">
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
        >
            <Card>
                <List listStyleType="disc">
                    <List.Item>
                        <Paragraph>
                            <Translation id="TR_TURN_ON_SECURE_SYNC_DATA_STORED_LOCALLY" />
                        </Paragraph>
                    </List.Item>
                    <List.Item>
                        <Paragraph>
                            <Translation id="TR_TURN_ON_SECURE_SYNC_ONLY_AUTHORIZED_DEVICES" />
                        </Paragraph>
                    </List.Item>
                </List>
            </Card>
        </Modal>
    );
};
