import type { CryptoId } from 'invity-api';

import { cryptoIdToNetworkSymbolAndContractAddress } from '@suite-common/trading';
import { type BoxProps, HStack, Text } from '@suite-native/atoms';
import { CryptoIcon } from '@suite-native/icons';
import { useFormatCryptoValue } from '@suite-native/trading-atoms';
import { CryptoToFiatValueBadge } from '@suite-native/trading-quote-utils';

export type CryptoAmountRowProps = {
    cryptoId?: CryptoId;
    amount?: string;
    direction: 'from' | 'to';
    style?: BoxProps['style'];
};

export const CryptoAmountRow = ({ cryptoId, amount, direction, style }: CryptoAmountRowProps) => {
    const formatCryptoValue = useFormatCryptoValue();
    const { symbol, contractAddress } = cryptoIdToNetworkSymbolAndContractAddress(cryptoId);

    if (!symbol || !cryptoId || !amount) {
        return null;
    }

    const formattedAmount = formatCryptoValue(amount, cryptoId);
    const color = direction === 'from' ? 'contentCritical' : 'contentBrand';
    const prefix = direction === 'from' ? '-' : '+';

    return (
        <HStack justifyContent="space-between" alignItems="center" flex={1} style={style}>
            <HStack alignItems="center">
                <CryptoIcon symbol={symbol} contractAddress={contractAddress} size="extraSmall" />
                {formattedAmount && (
                    <Text variant="body-sm" color={color}>
                        {prefix + formattedAmount}
                    </Text>
                )}
            </HStack>
            <CryptoToFiatValueBadge
                amount={amount}
                cryptoId={cryptoId}
                color="contentSecondary"
                textAlign="right"
            />
        </HStack>
    );
};
