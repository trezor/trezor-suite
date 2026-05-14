import { Translation } from '@suite/intl';
import { closeModal } from '@suite/modal';
import { Column, H3, Modal, Paragraph } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useDispatch } from 'src/hooks/suite';

export const MoreRoundsNeededModal = () => {
    const dispatch = useDispatch();

    const close = () => dispatch(closeModal());

    return (
        <Modal
            onCancel={close}
            bottomContent={
                <Modal.Button intent="neutral" priority="secondary" onClick={close}>
                    <Translation id="TR_CLOSE" />
                </Modal.Button>
            }
            width={600}
            iconName="arrowsIn"
            intent="info"
        >
            <Column gap={spacings.xs}>
                <H3>
                    <Translation id="TR_COINJOIN_ENDED" />
                </H3>
                <Paragraph intent="neutral" priority="secondary">
                    <Translation id="TR_MORE_ROUNDS_NEEDED_DESCRIPTION" />
                </Paragraph>
            </Column>
        </Modal>
    );
};
