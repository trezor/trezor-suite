import { InfoSegments } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { FormattedDate } from 'src/components/suite';
import { useTranslation } from 'src/hooks/suite';
import { ExtendedMessageDescriptor } from 'src/types/suite';
import { Trade, TradeType } from 'src/types/wallet/coinmarketCommonTypes';
import { CoinmarketTransactionStatus } from 'src/views/wallet/coinmarket/common/CoinmarketTransactions/CoinmarketTransaction/CoinmarketTransactionStatus';

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
        <InfoSegments variant="tertiary" typographyStyle="label" margin={{ top: spacings.xs }}>
            {tradeType}
            <FormattedDate value={date} date time />
            <CoinmarketTransactionStatus trade={trade} />
        </InfoSegments>
    );
};
