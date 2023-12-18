import styled from 'styled-components';
import { Translation } from 'src/components/suite';
import { Button } from '@trezor/components';
import { useSendFormContext } from 'src/hooks/wallet';

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

export const CardanoOptions = () => {
    const { addOutput } = useSendFormContext();

    return (
        <Wrapper>
            <Row>
                <Left />
                <Right>
                    <AddRecipientButton
                        variant="tertiary"
                        size="small"
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
