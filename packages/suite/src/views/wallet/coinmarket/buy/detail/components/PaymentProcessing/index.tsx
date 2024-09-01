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

// eslint-disable-next-line local-rules/no-override-ds-component
const StyledLink = styled(Link)`
    margin-top: 50px;
`;

interface PaymentProcessingProps {
    supportUrl?: string;
}

const PaymentProcessing = ({ supportUrl }: PaymentProcessingProps) => (
    <Wrapper>
        <Spinner />
        <Title>
            <Translation id="TR_BUY_DETAIL_PENDING_TITLE" />
        </Title>
        {supportUrl && (
            <StyledLink href={supportUrl} target="_blank">
                <Button variant="tertiary">
                    <Translation id="TR_BUY_DETAIL_PENDING_SUPPORT" />
                </Button>
            </StyledLink>
        )}
    </Wrapper>
);

export default PaymentProcessing;
