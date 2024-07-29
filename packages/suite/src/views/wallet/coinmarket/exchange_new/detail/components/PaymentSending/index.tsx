import styled from 'styled-components';
import { variables, Spinner, Button, Link } from '@trezor/components';
import { Translation } from 'src/components/suite/Translation';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    flex-direction: column;
`;

const Title = styled.div`
    margin-top: 25px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

const StyledLink = styled(Link)`
    margin-top: 50px;
`;

interface PaymentSendingProps {
    supportUrl?: string;
}

const PaymentSending = ({ supportUrl }: PaymentSendingProps) => (
    <Wrapper>
        <Spinner />
        <Title>
            <Translation id="TR_EXCHANGE_DETAIL_SENDING_TITLE" />
        </Title>
        {supportUrl && (
            <StyledLink href={supportUrl} target="_blank">
                <Button variant="tertiary">
                    <Translation id="TR_EXCHANGE_DETAIL_SENDING_SUPPORT" />
                </Button>
            </StyledLink>
        )}
    </Wrapper>
);

export default PaymentSending;
