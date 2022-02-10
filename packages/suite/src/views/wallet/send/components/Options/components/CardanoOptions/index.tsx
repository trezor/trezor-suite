import React from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components';
import { Button } from '@trezor/components';
import { useSendFormContext } from '@wallet-hooks';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
`;

const Row = styled.div`
    display: flex;
    flex-flow: row wrap;
    flex: 1;
    justify-content: space-between;
`;

const Left = styled.div`
    display: flex;
    flex: 1;
    justify-content: flex-start;
    flex-wrap: wrap;
`;

const AddRecipientButton = styled(Button)`
    align-self: center;
`;

const Right = styled.div`
    display: flex;
`;

const CardanoOptions = () => {
    const { addOutput } = useSendFormContext();

    return (
        <Wrapper>
            <Row>
                <Left />
                <Right>
                    <AddRecipientButton
                        variant="tertiary"
                        icon="PLUS"
                        data-test="add-output"
                        onClick={addOutput}
                    >
                        <Translation id="RECIPIENT_ADD" />
                    </AddRecipientButton>
                </Right>
            </Row>
        </Wrapper>
    );
};

export default CardanoOptions;
