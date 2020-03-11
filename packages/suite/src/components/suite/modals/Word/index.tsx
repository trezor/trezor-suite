import React from 'react';
import styled from 'styled-components';
import TrezorConnect, { UI } from 'trezor-connect';
import { H2, P } from '@trezor/components';
import { Translation, WordInput } from '@suite-components';

const ModalWrapper = styled.div`
    padding: 32px 40px;
    justify-content: center;
`;

const Word = () => {
    return (
        <ModalWrapper>
            <H2>
                <Translation id="TR_FOLLOW_INSTRUCTIONS_ON_DEVICE" />
            </H2>

            <P size="tiny">
                <Translation id="TR_ENTER_SEED_WORDS_INSTRUCTION" />{' '}
                <Translation id="TR_RANDOM_SEED_WORDS_DISCLAIMER" />
            </P>
            <WordInput
                onSubmit={value =>
                    TrezorConnect.uiResponse({ type: UI.RECEIVE_WORD, payload: value })
                }
            />
        </ModalWrapper>
    );
};

export default Word;
