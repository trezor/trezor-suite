import React from 'react';
import styled from 'styled-components';
import TrezorConnect, { UI } from 'trezor-connect';
import { Modal, P, Link } from '@trezor/components';
import { Translation, WordInputAdvanced } from '@suite-components';

import { URLS } from '@suite-constants';

const BottomText = styled.div`
    margin-top: 20px;
`;

interface Props {
    count: 6 | 9;
}

const Word = ({ count }: Props) => {
    return (
        <Modal
            size="small"
            heading={<Translation id="TR_FOLLOW_INSTRUCTIONS_ON_DEVICE" />}
            description={<Translation id="TR_ADVANCED_RECOVERY_TEXT" />}
        >
            <WordInputAdvanced
                count={count}
                onSubmit={value =>
                    TrezorConnect.uiResponse({ type: UI.RECEIVE_WORD, payload: value })
                }
            />
            <BottomText>
                <P size="tiny">
                    <Translation id="TR_ADVANCED_RECOVERY_NOT_SURE" />{' '}
                    <Link size="tiny" href={URLS.WIKI_ADVANCED_RECOVERY}>
                        <Translation id="TR_LEARN_MORE_LINK" />
                    </Link>
                </P>
            </BottomText>
        </Modal>
    );
};

export default Word;
