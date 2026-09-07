import type { FiatCurrencyCode } from 'invity-api';

import { useFormatters } from '@suite-common/formatters';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { HStack, Text } from '@suite-native/atoms';
import { FiatCurrencyIcon } from '@suite-native/trading-atoms';
import { BigNumber } from '@trezor/utils';

export type FiatAmountRowProps = {
    amount?: string;
    direction: 'from' | 'to';
    fiatCurrency: FiatCurrencyCode;
};

export const FiatAmountRow = ({ amount, direction, fiatCurrency }: FiatAmountRowProps) => {
    const { BaseCurrencyAmountFormatter } = useFormatters();

    if (!amount) {
        return null;
    }

    const formattedAmount = BaseCurrencyAmountFormatter.format(
        asBaseCurrencyAmount(new BigNumber(amount)),
        { currency: fiatCurrency },
    );

    if (!formattedAmount) {
        return null;
    }

    const color = direction === 'from' ? 'contentCritical' : 'contentBrand';
    const prefix = direction === 'from' ? '-' : '+';

    return (
        <HStack alignItems="center">
            <FiatCurrencyIcon size="extraSmall" value={fiatCurrency} />
            <Text variant="body-sm" color={color}>
                {prefix + formattedAmount}
            </Text>
        </HStack>
    );
};
