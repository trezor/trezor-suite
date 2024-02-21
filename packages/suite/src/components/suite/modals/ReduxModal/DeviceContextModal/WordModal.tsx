import TrezorConnect from '@trezor/connect';
import { Translation, WordInput, Modal, ModalProps } from 'src/components/suite';
import styled from 'styled-components';
import { useIntl } from 'react-intl';
import messages from 'src/support/messages';

const StyledModal = styled(Modal)`
    min-height: 450px;
`;

export const WordModal = (props: ModalProps) => {
    const intl = useIntl();

    return (
        <StyledModal
            data-test-id="@recovery/word"
            heading={<Translation id="TR_FOLLOW_INSTRUCTIONS_ON_DEVICE" />}
            description={
                <>
                    <Translation id="TR_ENTER_SEED_WORDS_INSTRUCTION" />{' '}
                    <Translation id="TR_RANDOM_SEED_WORDS_DISCLAIMER" />
                </>
            }
            onCancel={() => TrezorConnect.cancel(intl.formatMessage(messages.TR_CANCELLED))}
            isCancelable
            totalProgressBarSteps={5}
            currentProgressBarStep={4}
            {...props}
        >
            <WordInput />
        </StyledModal>
    );
};
