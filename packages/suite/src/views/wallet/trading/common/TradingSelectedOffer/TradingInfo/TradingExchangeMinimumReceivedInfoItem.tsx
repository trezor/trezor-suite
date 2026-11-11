import { type CryptoId } from 'invity-api';

import { Translation } from '@suite/intl';
import { cryptoIdToNetworkSymbolAndContractAddress } from '@suite-common/trading';
import { InfoItem, Text } from '@trezor/components';

import { FormattedCryptoAmount } from '#src/components/suite';

type TradingExchangeMinimumReceivedInfoItemProps = {
    cryptoId: CryptoId;
    minimumYouGetAmount: string;
};

export const TradingExchangeMinimumReceivedInfoItem = ({
    cryptoId,
    minimumYouGetAmount,
}: TradingExchangeMinimumReceivedInfoItemProps) => {
    const { networkSymbol, contractAddress } = cryptoIdToNetworkSymbolAndContractAddress(cryptoId);

    return (
        <InfoItem label={<Translation id="TR_EXCHANGE_SWAP_SLIPPAGE_MINIMUM" />} direction="row">
            <Text typographyStyle="body-sm" data-testid="@trading/offer/info/minimum-received">
                <FormattedCryptoAmount
                    value={minimumYouGetAmount}
                    networkSymbol={networkSymbol}
                    contractAddress={contractAddress}
                />
            </Text>
        </InfoItem>
    );
};
