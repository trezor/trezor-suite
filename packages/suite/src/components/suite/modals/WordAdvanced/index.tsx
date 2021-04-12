import React from 'react';
import styled from 'styled-components';
import TrezorConnect, { UI } from 'trezor-connect';
import { P } from '@trezor/components';
import { Translation, WordInputAdvanced, TrezorLink, Modal, ModalProps } from '@suite-components';

import { URLS } from '@suite-constants';

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
`;
const BottomText = styled.div`
    margin-top: 20px;
`;

interface Props extends ModalProps {
    count: 6 | 9;
}

const WordAdvanced = ({ count, ...rest }: Props) => (
    <Modal
        fixedWidth={['100%', '100%', '100%', '100%']}
        heading={<Translation id="TR_FOLLOW_INSTRUCTIONS_ON_DEVICE" />}
        description={<Translation id="TR_ADVANCED_RECOVERY_TEXT" />}
        {...rest}
    >
        <ContentWrapper>
            <WordInputAdvanced
                count={count}
                onSubmit={value =>
                    TrezorConnect.uiResponse({ type: UI.RECEIVE_WORD, payload: value })
                }
            />
            <BottomText>
                <P size="tiny">
                    <Translation id="TR_ADVANCED_RECOVERY_NOT_SURE" />{' '}
                    <TrezorLink size="tiny" href={URLS.WIKI_ADVANCED_RECOVERY}>
                        <Translation id="TR_LEARN_MORE" />
                    </TrezorLink>
                </P>
            </BottomText>
        </ContentWrapper>
    </Modal>
);

export default WordAdvanced;
