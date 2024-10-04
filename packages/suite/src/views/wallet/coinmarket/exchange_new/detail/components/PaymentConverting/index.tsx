import styled from 'styled-components';
import { variables, Spinner, Button, Link } from '@trezor/components';
import { Translation } from 'src/components/suite/Translation';
import { spacingsPx } from '@trezor/theme';

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

const LinkWrapper = styled.div`
    margin-top: ${spacingsPx.xxxxl};
`;

interface PaymentConvertingProps {
    supportUrl?: string;
}

const PaymentConverting = ({ supportUrl }: PaymentConvertingProps) => (
    <Wrapper>
        <Spinner />
        <Title>
            <Translation id="TR_EXCHANGE_DETAIL_CONVERTING_TITLE" />
        </Title>
        {supportUrl && (
            <LinkWrapper>
                <Link href={supportUrl} target="_blank">
                    <Button variant="tertiary">
                        <Translation id="TR_EXCHANGE_DETAIL_CONVERTING_SUPPORT" />
                    </Button>
                </Link>
            </LinkWrapper>
        )}
    </Wrapper>
);

export default PaymentConverting;
