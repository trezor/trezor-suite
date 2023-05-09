import React from 'react';

import { HStack } from '@suite-native/atoms';
import { CryptoAmountFormatter } from '@suite-native/formatters';
import { CryptoIcon } from '@suite-common/icons';
import { NetworkSymbol } from '@suite-common/wallet-config';

type AccountDetailBalanceProps = {
    value: string;
    networkSymbol: NetworkSymbol;
    isBalance?: boolean;
};

export const AccountDetailCryptoValue = ({
    value,
    networkSymbol,
    isBalance = true,
}: AccountDetailBalanceProps) => (
    <HStack
        spacing="small"
        flexDirection="row"
        alignItems="center"
        marginBottom="large"
        justifyContent="center"
    >
        <CryptoIcon name={networkSymbol} />
        <CryptoAmountFormatter
            value={value}
            network={networkSymbol}
            isBalance={isBalance}
            adjustsFontSizeToFit
        />
    </HStack>
);
