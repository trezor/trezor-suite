import { Row } from '@trezor/components';
import { spacingsPx, typographyStylesBase } from '@trezor/theme';
import { Translation } from 'src/components/suite';
import { CoinmarketTransactionText } from 'src/views/wallet/coinmarket';
import styled from 'styled-components';

interface CoinmarketTransactionIdProps {
    transactionId: string;
}

const CoinmarketTradeIdTitle = styled.span`
    padding-right: ${spacingsPx.xxs};
`;

const CoinmarketTradeId = styled.span`
    font-weight: ${typographyStylesBase.highlight.fontWeight};
`;

export const CoinmarketTransactionId = ({ transactionId }: CoinmarketTransactionIdProps) => (
    <CoinmarketTransactionText>
        <Row flexWrap="wrap">
            <CoinmarketTradeIdTitle>
                <Translation id="TR_COINMARKET_TRANS_ID" />
            </CoinmarketTradeIdTitle>
            <CoinmarketTradeId>{transactionId}</CoinmarketTradeId>
        </Row>
    </CoinmarketTransactionText>
);
