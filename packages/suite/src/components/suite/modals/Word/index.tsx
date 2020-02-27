import React from 'react';
import styled from 'styled-components';
import TrezorConnect, { UI } from 'trezor-connect';
import { H2, P, Link } from '@trezor/components';
import { Translation, WordInput, ExternalLink } from '@suite-components';
import messages from '@suite/support/messages';
import { URLS } from '@suite-constants';

const ModalWrapper = styled.div`
    padding: 32px 40px;
    justify-content: center;
    /* min-width: 40vw;
    max-width: 80vw; */
`;

const Word = () => {
    return (
        <ModalWrapper>
            <H2>
            Follow instructions on the device
            </H2>
            
            <P size="tiny">
                <Translation {...messages.TR_ENTER_SEED_WORDS_INSTRUCTION} />{' '}
                <Translation
                        {...messages.TR_RANDOM_SEED_WORDS_DISCLAIMER}
                    />
            </P>
            <WordInput
                onSubmit={value =>
                    TrezorConnect.uiResponse({ type: UI.RECEIVE_WORD, payload: value })
                }
            />
            <ExternalLink href={URLS.RECOVERY_MODEL_ONE_URL}>
                <Translation {...messages.TR_LEARN_MORE_LINK} />
            </ExternalLink>
        </ModalWrapper>
    );
};

export default Word;
