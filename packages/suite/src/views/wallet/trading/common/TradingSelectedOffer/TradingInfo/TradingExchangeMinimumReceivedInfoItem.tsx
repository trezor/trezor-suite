import { Translation } from '@suite/intl';
import { InfoItem, Text } from '@trezor/components';

import { FormattedCryptoAmount } from 'src/components/suite';

type TradingExchangeMinimumReceivedInfoItemProps = {
    contractAddress?: string;
    minimumYouGetAmount: string;
    symbol?: string;
};

export const TradingExchangeMinimumReceivedInfoItem = ({
    contractAddress,
    minimumYouGetAmount,
    symbol,
}: TradingExchangeMinimumReceivedInfoItemProps) => (
    <InfoItem label={<Translation id="TR_EXCHANGE_SWAP_SLIPPAGE_MINIMUM" />} direction="row">
        <Text typographyStyle="body-sm">
            <FormattedCryptoAmount
                value={minimumYouGetAmount}
                symbol={symbol}
                contractAddress={contractAddress}
            />
        </Text>
    </InfoItem>
);
