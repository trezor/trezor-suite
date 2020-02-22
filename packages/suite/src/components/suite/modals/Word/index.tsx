import React from 'react';
import styled from 'styled-components';
import TrezorConnect, { UI } from 'trezor-connect';
import { H2, Link } from '@trezor/components';
import { Translation, WordInput } from '@suite-components';
import messages from '@suite/support/messages';
// todo: no design yet, but I guess we are going to use URLS
// import { URLS } from '@suite-constants';

const ModalWrapper = styled.div`
    padding: 30px 45px;
    width: 356px;
`;

const Word = () => {
    return (
        <ModalWrapper>
            <H2>Enter word</H2>
            <WordInput
                onSubmit={value =>
                    TrezorConnect.uiResponse({ type: UI.RECEIVE_WORD, payload: value })
                }
            />
            <Link href="todo: add some cool link">
                <Translation {...messages.TR_LEARN_MORE_LINK} />
            </Link>
        </ModalWrapper>
    );
};

export default Word;
