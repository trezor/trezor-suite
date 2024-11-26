import styled from 'styled-components';

import { Spinner, Button, H4 } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite/Translation';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    flex-direction: column;
`;

interface PaymentProcessingProps {
    supportUrl?: string;
}

export const CoinmarketDetailBuyPaymentProcessing = ({ supportUrl }: PaymentProcessingProps) => (
    <Wrapper>
        <Spinner />
        <H4 margin={{ top: spacings.xl }}>
            <Translation id="TR_BUY_DETAIL_PENDING_TITLE" />
        </H4>
        {supportUrl && (
            <Button
                variant="tertiary"
                href={supportUrl}
                target="_blank"
                margin={{ top: spacings.xxxxl }}
            >
                <Translation id="TR_BUY_DETAIL_PENDING_SUPPORT" />
            </Button>
        )}
    </Wrapper>
);
