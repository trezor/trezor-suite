import type { CryptoId } from 'invity-api';

import { type BoxProps, HStack, Text } from '@suite-native/atoms';
import { IconByCryptoId, useFormatCryptoValue } from '@suite-native/trading-atoms';
import { CryptoToFiatValueBadge } from '@suite-native/trading-quote-utils';

export type CryptoAmountRowProps = {
    cryptoId?: CryptoId;
    amount?: string;
    direction: 'from' | 'to';
    style?: BoxProps['style'];
    withNetworkIcon?: boolean;
};

export const CryptoAmountRow = ({
    cryptoId,
    amount,
    direction,
    style,
    withNetworkIcon,
}: CryptoAmountRowProps) => {
    const formatCryptoValue = useFormatCryptoValue();
    if (!cryptoId || !amount) {
        return null;
    }

    const formattedAmount = formatCryptoValue(amount, cryptoId);
    const color = direction === 'from' ? 'contentCritical' : 'contentBrand';
    const prefix = direction === 'from' ? '-' : '+';

    return (
        <HStack justifyContent="space-between" alignItems="center" flex={1} style={style}>
            <HStack alignItems="center">
                <IconByCryptoId
                    cryptoId={cryptoId}
                    size="extraSmall"
                    withNetwork={withNetworkIcon}
                />
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
