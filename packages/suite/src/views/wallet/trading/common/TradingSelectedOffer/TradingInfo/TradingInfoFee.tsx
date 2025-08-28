import { NetworkSymbol } from '@suite-common/wallet-config';
import { AmountUnit } from '@suite-common/wallet-utils';
import { InfoItem } from '@trezor/components';

import { BaseCurrencyValue, Translation } from 'src/components/suite';

interface TradingInfoFeeProps {
    symbol: NetworkSymbol | undefined;
    amount: AmountUnit | undefined;
}

export const TradingInfoFee = ({ symbol, amount }: TradingInfoFeeProps) => (
    <InfoItem label={<Translation id="TR_TRADING_NETWORK_FEE" />} direction="row">
        {amount && symbol && (
            <BaseCurrencyValue
                disableHiddenPlaceholder
                amount={amount}
                symbol={symbol}
                showApproximationIndicator
            />
        )}
    </InfoItem>
);
