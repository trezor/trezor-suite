import { Column, H3, Modal, Paragraph } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { onCancel as closeModal } from 'src/actions/suite/modalActions';
import { Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';

export const MoreRoundsNeededModal = () => {
    const dispatch = useDispatch();

    const close = () => dispatch(closeModal());

    return (
        <Modal
            onCancel={close}
            bottomContent={
                <Modal.Button variant="tertiary" onClick={close}>
                    <Translation id="TR_CLOSE" />
                </Modal.Button>
            }
            size="small"
            iconName="arrowsIn"
            variant="info"
        >
            <Column gap={spacings.xs}>
                <H3>
                    <Translation id="TR_COINJOIN_ENDED" />
                </H3>
                <Paragraph variant="tertiary">
                    <Translation id="TR_MORE_ROUNDS_NEEDED_DESCRIPTION" />
                </Paragraph>
            </Column>
        </Modal>
    );
};
