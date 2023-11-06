import { memo } from 'react';

import { HStack } from '@suite-native/atoms';
import { CryptoAmountFormatter } from '@suite-native/formatters';
import { CryptoIcon } from '@suite-common/icons';
import { NetworkSymbol } from '@suite-common/wallet-config';

type AccountDetailBalanceProps = {
    value: string;
    networkSymbol: NetworkSymbol;
    isBalance?: boolean;
};

export const AccountDetailCryptoValue = memo(
    ({ value, networkSymbol, isBalance = true }: AccountDetailBalanceProps) => (
        <HStack spacing="s" flexDirection="row" alignItems="center" justifyContent="center">
            <CryptoIcon symbol={networkSymbol} size="xs" />
            <CryptoAmountFormatter
                value={value}
                network={networkSymbol}
                isBalance={isBalance}
                adjustsFontSizeToFit
            />
        </HStack>
    ),
);

AccountDetailCryptoValue.displayName = 'AccountDetailCryptoValue';
