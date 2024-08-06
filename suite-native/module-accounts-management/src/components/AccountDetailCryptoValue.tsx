import { memo } from 'react';

import { HStack } from '@suite-native/atoms';
import { CryptoAmountFormatter, EthereumTokenAmountFormatter } from '@suite-native/formatters';
import { CryptoIcon } from '@suite-common/icons';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { TokenAddress, TokenSymbol } from '@suite-common/wallet-types';

type AccountDetailBalanceProps = {
    value: string;
    networkSymbol: NetworkSymbol;
    isBalance?: boolean;
    decimals?: number;
    tokenSymbol?: TokenSymbol;
    tokenAddress?: TokenAddress;
};

export const AccountDetailCryptoValue = memo(
    ({
        value,
        networkSymbol,
        tokenSymbol,
        tokenAddress,
        isBalance = true,
        decimals,
    }: AccountDetailBalanceProps) => (
        <HStack spacing="small" flexDirection="row" alignItems="center" justifyContent="center">
            <CryptoIcon symbol={tokenAddress || networkSymbol} size="extraSmall" />
            {tokenSymbol ? (
                <EthereumTokenAmountFormatter
                    value={value}
                    symbol={tokenSymbol}
                    adjustsFontSizeToFit
                />
            ) : (
                <CryptoAmountFormatter
                    value={value}
                    network={networkSymbol}
                    isBalance={isBalance}
                    adjustsFontSizeToFit
                    decimals={decimals}
                />
            )}
        </HStack>
    ),
);

AccountDetailCryptoValue.displayName = 'AccountDetailCryptoValue';
