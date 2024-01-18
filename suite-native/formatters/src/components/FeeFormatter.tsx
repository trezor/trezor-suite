import { useMemo } from 'react';

import { fromWei } from 'web3-utils';

import { Text } from '@suite-native/atoms';
import { WalletAccountTransaction } from '@suite-common/wallet-types';
import { getFeeRate, getFeeUnits } from '@suite-common/wallet-utils';
import { networks } from '@suite-common/wallet-config';

type FeeFormatterProps = {
    transaction: WalletAccountTransaction;
};

export const FeeFormatter = ({ transaction }: FeeFormatterProps) => {
    const { networkType } = networks[transaction.symbol];

    const formattedValue = useMemo(
        () =>
            networkType === 'ethereum'
                ? fromWei(transaction.ethereumSpecific?.gasPrice ?? '0', 'gwei')
                : transaction.feeRate || getFeeRate(transaction),
        [networkType, transaction],
    );

    const formattedUnit = getFeeUnits(networkType);

    return <Text>{`${formattedValue} ${formattedUnit}`}</Text>;
};
