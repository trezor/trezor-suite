import React from 'react';
import styled from 'styled-components';
import { Button, variables } from '@trezor/components';
import { Modal, Translation } from '@suite-components';
import type { UserContextPayload } from '@suite-actions/modalActions';

const Row = styled.div`
    display: flex;
    text-align: left;
    margin-bottom: 8px;
    & > * {
        &:first-child {
            min-width: 120px;
            font-weight: ${variables.FONT_WEIGHT.MEDIUM};
        }
        &:not(:first-child) {
            overflow-wrap: anywhere;
        }
    }
`;

const ActionRow = styled.div`
    display: flex;
    justify-content: space-evenly;
    margin-top: 24px;
`;

const StyledButton = styled(Button)`
    width: 200px;
`;

type Props = Extract<UserContextPayload, { type: 'send-aopp-message' }> & {
    onCancel: () => void;
};

const SendAoppMessage = ({ onCancel, decision, address, signature, callback }: Props) => (
    <Modal cancelable onCancel={onCancel} heading={<Translation id="TR_AOPP_SEND" />}>
        <Row>
            <Translation id="TR_ADDRESS" />
            <div>{address}</div>
        </Row>
        <Row>
            <Translation id="TR_SIGNATURE" />
            <div>{signature}</div>
        </Row>
        <Row>
            <Translation id="TR_TO" />
            <div>{callback}</div>
        </Row>
        <ActionRow>
            <StyledButton
                onClick={() => {
                    decision.resolve(true);
                    onCancel();
                }}
            >
                <Translation id="TR_NAV_SEND" />
            </StyledButton>
        </ActionRow>
    </Modal>
);

export default SendAoppMessage;
