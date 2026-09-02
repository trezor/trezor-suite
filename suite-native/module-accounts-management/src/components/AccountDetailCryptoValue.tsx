import { memo } from 'react';

import { type NetworkSymbol, getDisplaySymbol } from '@suite-common/wallet-config';
import type { TokenSymbol } from '@suite-common/wallet-types';
import { HStack } from '@suite-native/atoms';
import {
    ExactCryptoAmountFormatter,
    ExactTokenAmountFormatter,
    convertTokenValueToDecimal,
} from '@suite-native/formatters';

type AccountDetailBalanceProps = {
    value: string;
    symbol: NetworkSymbol;
    isBalance?: boolean;
    tokenSymbol?: TokenSymbol | null;
    tokenDecimals?: number | null;
};

export const AccountDetailCryptoValue = memo(
    ({
        value,
        symbol,
        tokenSymbol,
        tokenDecimals,
        isBalance = true,
    }: AccountDetailBalanceProps) => (
        <HStack spacing="sp8" flexDirection="row" alignItems="center" justifyContent="center">
            {tokenSymbol ? (
                <ExactTokenAmountFormatter
                    value={convertTokenValueToDecimal(value, tokenDecimals ?? 0)}
                    tokenSymbol={getDisplaySymbol(tokenSymbol) as TokenSymbol}
                    maxDisplayedDecimals={tokenDecimals ?? undefined}
                    adjustsFontSizeToFit
                />
            ) : (
                <ExactCryptoAmountFormatter
                    value={value}
                    symbol={symbol}
                    isBalance={isBalance}
                    adjustsFontSizeToFit
                />
            )}
        </HStack>
    ),
);

AccountDetailCryptoValue.displayName = 'AccountDetailCryptoValue';
