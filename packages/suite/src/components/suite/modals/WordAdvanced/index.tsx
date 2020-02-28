import React from 'react';
import styled from 'styled-components';
import TrezorConnect, { UI } from 'trezor-connect';
import { H2, P, Link } from '@trezor/components';
import { Translation, WordInputAdvanced } from '@suite-components';
import ModalWrapper from '@suite-components/ModalWrapper';
import messages from '@suite/support/messages';
import { URLS } from '@suite-constants';

const Wrapper = styled(ModalWrapper)`
    padding: 30px 45px;
    display: flex;
    flex-direction: column;
`;

const BottomText = styled.div`
    margin-top: 20px;
`;

interface Props {
    count: 6 | 9;
}

const Word = ({ count }: Props) => {
    return (
        <Wrapper>
            <H2>
                <Translation {...messages.TR_FOLLOW_INSTRUCTIONS_ON_DEVICE} />
            </H2>
            <P size="tiny">
                <Translation {...messages.TR_ADVANCED_RECOVERY_TEXT} />
            </P>
            <WordInputAdvanced
                count={count}
                onSubmit={value =>
                    TrezorConnect.uiResponse({ type: UI.RECEIVE_WORD, payload: value })
                }
            />
            <BottomText>
                <P size="tiny">
                    <Translation {...messages.TR_ADVANCED_RECOVERY_NOT_SURE} />{' '}
                    <Link size="tiny" href={URLS.WIKI_ADVANCED_RECOVERY}>
                        <Translation {...messages.TR_LEARN_MORE_LINK} />
                    </Link>
                </P>
            </BottomText>
        </Wrapper>
    );
};

export default Word;
