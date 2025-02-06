import { memo } from 'react';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import type { TokenSymbol } from '@suite-common/wallet-types';
import { HStack } from '@suite-native/atoms';
import { CryptoAmountFormatter, TokenAmountFormatter } from '@suite-native/formatters';

type AccountDetailBalanceProps = {
    value: string;
    symbol: NetworkSymbol;
    isBalance?: boolean;
    tokenSymbol?: TokenSymbol | null;
};

export const AccountDetailCryptoValue = memo(
    ({ value, symbol, tokenSymbol, isBalance = true }: AccountDetailBalanceProps) => (
        <HStack spacing="sp8" flexDirection="row" alignItems="center" justifyContent="center">
            {tokenSymbol ? (
                <TokenAmountFormatter
                    value={value}
                    tokenSymbol={tokenSymbol}
                    adjustsFontSizeToFit
                />
            ) : (
                <CryptoAmountFormatter
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
