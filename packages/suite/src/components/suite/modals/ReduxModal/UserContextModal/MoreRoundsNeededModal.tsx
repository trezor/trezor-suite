import { Column, H3, NewModal, Paragraph } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { onCancel as closeModal } from 'src/actions/suite/modalActions';
import { Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';

export const MoreRoundsNeededModal = () => {
    const dispatch = useDispatch();

    const close = () => dispatch(closeModal());

    return (
        <NewModal
            onCancel={close}
            bottomContent={
                <NewModal.Button variant="tertiary" onClick={close}>
                    <Translation id="TR_CLOSE" />
                </NewModal.Button>
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
        </NewModal>
    );
};
