import { type ReactNode } from 'react';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Translation } from '@suite-native/intl';

import { TransactionCompleteAmountValue } from './TransactionCompleteAmountValue';
import { type EarnCompleteSummaryRow } from '../earn/EarnCompleteScreenContent';
import { getYieldCompleteStatusRow } from '../yield/YieldCompleteScreenPresets';

type GetTransactionCompleteRowsParams = {
    accountSymbol: NetworkSymbol;
    amountInBaseUnits: string;
    amountLabel: ReactNode;
    apyValue?: ReactNode;
};

export const getTransactionCompleteRows = ({
    accountSymbol,
    amountInBaseUnits,
    amountLabel,
    apyValue,
}: GetTransactionCompleteRowsParams): EarnCompleteSummaryRow[] => [
    getYieldCompleteStatusRow(),
    {
        key: 'amount',
        label: amountLabel,
        value: (
            <TransactionCompleteAmountValue
                accountSymbol={accountSymbol}
                amountInBaseUnits={amountInBaseUnits}
            />
        ),
    },
    ...(apyValue !== undefined
        ? [
              {
                  key: 'apy',
                  label: <Translation id="earn.yieldCompleteScreen.apy" />,
                  value: apyValue,
              },
          ]
        : []),
];
