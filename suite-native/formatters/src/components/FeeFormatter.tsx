import { useMemo } from 'react';

import { networks } from '@suite-common/wallet-config';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import { fromWei, getEffectiveGasPrice, getFeeRate, getFeeUnits } from '@suite-common/wallet-utils';
import { Text } from '@suite-native/atoms';

type FeeFormatterProps = {
    transaction: WalletAccountTransaction;
};

export const FeeFormatter = ({ transaction }: FeeFormatterProps) => {
    const { networkType } = networks[transaction.symbol];

    const formattedValue = useMemo(
        () =>
            networkType === 'ethereum'
                ? fromWei(getEffectiveGasPrice(transaction.ethereumSpecific)).toGwei()
                : transaction.feeRate || getFeeRate(transaction),
        [networkType, transaction],
    );

    const formattedUnit = getFeeUnits(networkType);

    return <Text>{`${formattedValue} ${formattedUnit}`}</Text>;
};
