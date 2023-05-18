import React from 'react';
import styled from 'styled-components';
import TrezorConnect from '@trezor/connect';
import { P } from '@trezor/components';
import { HELP_CENTER_ADVANCED_RECOVERY_URL } from '@trezor/urls';
import { Translation, WordInputAdvanced, TrezorLink, Modal, ModalProps } from '@suite-components';

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
`;
const BottomText = styled.div`
    margin-top: 20px;
`;

const StyledModal = styled(Modal)`
    width: 100%;
`;

interface WordAdvancedProps extends ModalProps {
    count: 6 | 9;
}

export const WordAdvanced = ({ count, ...rest }: WordAdvancedProps) => (
    <StyledModal
        heading={<Translation id="TR_FOLLOW_INSTRUCTIONS_ON_DEVICE" />}
        description={<Translation id="TR_ADVANCED_RECOVERY_TEXT" />}
        onCancel={() => TrezorConnect.cancel('cancelled')}
        isCancelable
        totalProgressBarSteps={5}
        currentProgressBarStep={4}
        {...rest}
    >
        <ContentWrapper>
            <WordInputAdvanced count={count} />
            <BottomText>
                <P size="tiny">
                    <Translation id="TR_ADVANCED_RECOVERY_NOT_SURE" />{' '}
                    <TrezorLink size="tiny" href={HELP_CENTER_ADVANCED_RECOVERY_URL}>
                        <Translation id="TR_LEARN_MORE" />
                    </TrezorLink>
                </P>
            </BottomText>
        </ContentWrapper>
    </StyledModal>
);
