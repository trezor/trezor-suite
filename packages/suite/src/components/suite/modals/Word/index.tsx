import React from 'react';
import TrezorConnect, { UI } from 'trezor-connect';
import { Translation, WordInput, Modal, ModalProps } from '@suite-components';

const Word = (props: ModalProps) => (
    <Modal
        fixedWidth={['100%', '100%', '100%', '100%']}
        fixedHeight={['100%', '100%', '100%', '100%']}
        useFixedHeight
        data-test="@recovery/word"
        noPadding
        heading={<Translation id="TR_FOLLOW_INSTRUCTIONS_ON_DEVICE" />}
        description={
            <>
                <Translation id="TR_ENTER_SEED_WORDS_INSTRUCTION" />{' '}
                <Translation id="TR_RANDOM_SEED_WORDS_DISCLAIMER" />
            </>
        }
        {...props}
    >
        <WordInput
            onSubmit={value => {
                TrezorConnect.uiResponse({ type: UI.RECEIVE_WORD, payload: value });
            }}
        />
    </Modal>
);

export default Word;
