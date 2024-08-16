import { Row } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { CoinmarketPayGetLabelType, CoinmarketTradeType } from 'src/types/coinmarket/coinmarket';
import {
    CoinmarketInfoAmount,
    CoinmarketInfoLeftColumn,
    CoinmarketInfoRightColumn,
} from 'src/views/wallet/coinmarket';
import { CoinmarketCoinImage } from 'src/views/wallet/coinmarket/common/CoinmarketCoinImage';
import { CoinmarketCryptoAmount } from 'src/views/wallet/coinmarket/common/CoinmarketCryptoAmount';
import { CoinmarketFiatAmount } from 'src/views/wallet/coinmarket/common/CoinmarketFiatAmount';

interface CoinmarketInfoItemProps {
    type: CoinmarketTradeType;
    itemType: 'receive' | 'send';
    label: CoinmarketPayGetLabelType;
    currency?: string;
    amount?: string;
}

export const CoinmarketInfoItem = ({
    type,
    itemType,
    label,
    currency,
    amount,
}: CoinmarketInfoItemProps) => (
    <Row alignItems="center" justifyContent="space-between">
        <CoinmarketInfoLeftColumn>
            <Translation id={label} />
        </CoinmarketInfoLeftColumn>
        <CoinmarketInfoRightColumn>
            {type === 'exchange' || itemType === 'receive' ? (
                <>
                    <CoinmarketCoinImage symbol={currency} />
                    <CoinmarketInfoAmount>
                        <CoinmarketCryptoAmount amount={amount} symbol={currency} />
                    </CoinmarketInfoAmount>
                </>
            ) : (
                <CoinmarketFiatAmount amount={amount} currency={currency} />
            )}
        </CoinmarketInfoRightColumn>
    </Row>
);
