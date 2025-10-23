import { labelingActions } from '@suite-common/local-first-storage';
import { Card, List, Modal, Paragraph } from '@trezor/components';

import { useDispatch } from 'src/hooks/suite';
import { useLabelingCombined } from 'src/hooks/suite/useLabelingCombined';

type TurnOnSecureSyncModalProps = {
    onClose: () => void;
};

// TODO add translations
export const TurnOnSecureSyncModal = ({ onClose }: TurnOnSecureSyncModalProps) => {
    const dispatch = useDispatch();
    const { localFirstEnableIfNeeded } = useLabelingCombined({ deviceStaticSessionId: undefined });

    const onSwitch = () => {
        localFirstEnableIfNeeded();
        dispatch(labelingActions.updateshowLocalFirstStorage({ isShownInSettings: false }));
    };

    return (
        <Modal
            heading="Turn on secure sync to use labels"
            description="Secure sync keeps your data consistent across all of your devices."
            onCancel={onClose}
            bottomContent={
                <>
                    <Modal.Button onClick={onSwitch}>Turn on</Modal.Button>
                    <Modal.Button onClick={onClose} variant="tertiary">
                        Cancel
                    </Modal.Button>
                </>
            }
        >
            <Card>
                <List>
                    <List.Item>
                        <Paragraph>
                            Data is stored locally and synced only with devices you authorize.
                        </Paragraph>
                    </List.Item>
                    <List.Item>
                        <Paragraph>
                            Only devices you authorize with your Trezor can decrypt the data.
                        </Paragraph>
                    </List.Item>
                </List>
            </Card>
        </Modal>
    );
};
