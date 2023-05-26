import React from 'react';
import TrezorConnect from '@trezor/connect';
import { Translation, WordInput, Modal, ModalProps } from '@suite-components';
import styled from 'styled-components';
import { useIntl } from 'react-intl';
import messages from '@suite/support/messages';

const StyledModal = styled(Modal)`
    min-height: 450px;
`;

export const Word = (props: ModalProps) => {
    const intl = useIntl();

    return (
        <StyledModal
            data-test="@recovery/word"
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
