import { memo } from 'react';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import type { TokenAddress, TokenSymbol } from '@suite-common/wallet-types';
import { HStack } from '@suite-native/atoms';
import { CryptoAmountFormatter, TokenAmountFormatter } from '@suite-native/formatters';
import { CryptoIcon } from '@suite-native/icons';

type AccountDetailBalanceProps = {
    value: string;
    symbol: NetworkSymbol;
    isBalance?: boolean;
    tokenSymbol?: TokenSymbol | null;
    tokenAddress?: TokenAddress;
};

export const AccountDetailCryptoValue = memo(
    ({ value, symbol, tokenSymbol, tokenAddress, isBalance = true }: AccountDetailBalanceProps) => (
        <HStack spacing="sp8" flexDirection="row" alignItems="center" justifyContent="center">
            <CryptoIcon symbol={symbol} contractAddress={tokenAddress} size="extraSmall" />

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
