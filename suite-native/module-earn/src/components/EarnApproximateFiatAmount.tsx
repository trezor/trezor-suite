import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import { HStack, Text } from '@suite-native/atoms';
import { BaseCurrencyAmountFormatter, useCryptoFiatConverters } from '@suite-native/formatters';

import { getApproximateFiatAmount } from '../utils/yieldFiatAmountUtils';

type EarnApproximateFiatAmountProps = {
    amount: string;
    symbol: NetworkSymbol;
    tokenContract?: TokenAddress;
};

export const EarnApproximateFiatAmount = ({
    amount,
    symbol,
    tokenContract,
}: EarnApproximateFiatAmountProps) => {
    const converters = useCryptoFiatConverters({ symbol, tokenContract });
    const fiatAmount = getApproximateFiatAmount({
        cryptoAmount: amount,
        convertCryptoToFiat: converters?.convertCryptoToFiat,
    });

    if (!fiatAmount) {
        return null;
    }

    return (
        <HStack spacing="sp2" alignItems="center">
            <Text variant="body-sm" color="contentSecondary">
                ≈
            </Text>
            <BaseCurrencyAmountFormatter
                value={fiatAmount}
                variant="body-sm"
                color="contentSecondary"
                numberOfLines={1}
            />
        </HStack>
    );
};
