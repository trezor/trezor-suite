import { Row } from '@trezor/components';
import { typographyStylesBase } from '@trezor/theme';
import { FormattedDate } from 'src/components/suite';
import { useTranslation } from 'src/hooks/suite';
import { ExtendedMessageDescriptor } from 'src/types/suite';
import { Trade, TradeType } from 'src/types/wallet/coinmarketCommonTypes';
import { CoinmarketTransactionText } from 'src/views/wallet/coinmarket';
import { CoinmarketTransactionStatus } from 'src/views/wallet/coinmarket/common/CoinmarketTransactions/CoinmarketTransaction/CoinmarketTransactionStatus';
import styled from 'styled-components';

const CoinmarketTransactionMedium = styled.div`
    font-weight: ${typographyStylesBase.highlight.fontWeight};
`;

interface CoinmarketTransactionInfoProps {
    trade: Trade;
}

const translationKeys: Record<
    TradeType,
    Extract<ExtendedMessageDescriptor['id'], 'TR_BUY' | 'TR_COINMARKET_SELL' | 'TR_COINMARKET_SWAP'>
> = {
    buy: 'TR_BUY',
    sell: 'TR_COINMARKET_SELL',
    exchange: 'TR_COINMARKET_SWAP',
};

export const CoinmarketTransactionInfo = ({ trade }: CoinmarketTransactionInfoProps) => {
    const { date } = trade;
    const { translationString } = useTranslation();
    const tradeType = translationString(translationKeys[trade.tradeType]).toUpperCase();

    return (
        <CoinmarketTransactionText>
            <CoinmarketTransactionMedium>
                <Row flexWrap="wrap">
                    {tradeType} • <FormattedDate value={date} date time /> •{' '}
                    <CoinmarketTransactionStatus trade={trade} />
                </Row>
            </CoinmarketTransactionMedium>
        </CoinmarketTransactionText>
    );
};
