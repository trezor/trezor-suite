import styled from 'styled-components';

import { Button, H4, Spinner } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite/Translation';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    flex-direction: column;
`;

interface PaymentSendingProps {
    supportUrl?: string;
}

export const TradingDetailExchangePaymentSending = ({ supportUrl }: PaymentSendingProps) => (
    <Wrapper>
        <Spinner />
        <H4 margin={{ top: spacings.xl }}>
            <Translation id="TR_EXCHANGE_DETAIL_SENDING_TITLE" />
        </H4>
        {supportUrl && (
            <Button
                variant="tertiary"
                href={supportUrl}
                target="_blank"
                margin={{ top: spacings.xxxxl }}
            >
                <Translation id="TR_EXCHANGE_DETAIL_SENDING_SUPPORT" />
            </Button>
        )}
    </Wrapper>
);
