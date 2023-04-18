import React from 'react';
import TrezorConnect, { UI } from '@trezor/connect';
import { Translation, WordInput, Modal, ModalProps } from '@suite-components';
import styled from 'styled-components';

const StyledModal = styled(Modal)`
    min-height: 360px;
`;

export const Word = (props: ModalProps) => (
    <StyledModal
        data-test="@recovery/word"
        heading={<Translation id="TR_FOLLOW_INSTRUCTIONS_ON_DEVICE" />}
        description={
            <>
                <Translation id="TR_ENTER_SEED_WORDS_INSTRUCTION" />{' '}
                <Translation id="TR_RANDOM_SEED_WORDS_DISCLAIMER" />
            </>
        }
        onCancel={() => TrezorConnect.cancel()}
        isCancelable
        totalProgressBarSteps={5}
        currentProgressBarStep={4}
        {...props}
    >
        <WordInput
            onSubmit={value => {
                TrezorConnect.uiResponse({ type: UI.RECEIVE_WORD, payload: value });
            }}
        />
    </StyledModal>
);
