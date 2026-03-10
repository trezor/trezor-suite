import { Translation } from '@suite/intl';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { InfoItem, Text } from '@trezor/components';

import { BaseCurrencyValue } from 'src/components/suite';

type TradingNetworkFeeInfoItemProps = {
    amount: string;
    symbol: NetworkSymbol;
};

export const TradingNetworkFeeInfoItem = ({ amount, symbol }: TradingNetworkFeeInfoItemProps) => (
    <InfoItem label={<Translation id="TR_TRADING_NETWORK_FEE" />} direction="row">
        <Text typographyStyle="body-sm">
            <BaseCurrencyValue
                disableHiddenPlaceholder
                amount={amount}
                symbol={symbol}
                rateType="current"
                showApproximationIndicator
            />
        </Text>
    </InfoItem>
);
