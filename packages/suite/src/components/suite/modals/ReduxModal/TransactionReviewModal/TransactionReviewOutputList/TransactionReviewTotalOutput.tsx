import { forwardRef } from 'react';
import BigNumber from 'bignumber.js';

import { formatAmount, formatNetworkAmount, isTestnet } from '@suite-common/wallet-utils';
import { selectDevice } from '@suite-common/wallet-core';
import { TrezorDevice } from 'src/types/suite';
import { Translation } from 'src/components/suite/Translation';
import { useSelector } from 'src/hooks/suite/useSelector';
import {
    getOutputState,
    getIsUpdatedSendFlow,
    getIsUpdatedEthereumSendFlow,
} from 'src/utils/wallet/reviewTransactionUtils';
import { TransactionReviewStepIndicator } from './TransactionReviewStepIndicator';
import {
    TransactionReviewOutputElement,
    OutputElementLine,
} from './TransactionReviewOutputElement';
import type { TransactionReviewOutputListProps } from './TransactionReviewOutputList';

type StepIndicatorProps = Pick<
    TransactionReviewOutputListProps,
    'signedTx' | 'outputs' | 'buttonRequestsCount'
>;

const StepIndicator = ({ signedTx, outputs, buttonRequestsCount }: StepIndicatorProps) => {
    const state = signedTx ? 'success' : getOutputState(outputs.length, buttonRequestsCount);

    return <TransactionReviewStepIndicator state={state} size={16} />;
};

type TransactionReviewTotalOutputProps = Omit<
    TransactionReviewOutputListProps,
    'precomposedForm' | 'decision' | 'detailsOpen' | 'isRbfAction'
>;

const getLines = (
    device: TrezorDevice,
    networkType: TransactionReviewOutputListProps['account']['networkType'],
    symbol: TransactionReviewOutputListProps['account']['symbol'],
    precomposedTx: TransactionReviewOutputListProps['precomposedTx'],
): Array<OutputElementLine> => {
    const isUpdatedSendFlow = getIsUpdatedSendFlow(device);
    const isUpdatedEthereumSendFlow = getIsUpdatedEthereumSendFlow(device, networkType);
    const isEthereum = networkType === 'ethereum';
    const isSolana = networkType === 'solana';
    const showAmountWithoutFee = isEthereum || isSolana;
    const feeLabel = ((network: TransactionReviewOutputListProps['account']['networkType']) => {
        switch (network) {
            case 'ethereum':
                return 'MAX_FEE';
            case 'solana':
                return 'TR_TX_FEE';
            default:
                return 'TR_INCLUDING_FEE';
        }
    })(networkType);
    const tokenInfo = precomposedTx?.token;
    const amountWithoutFee = new BigNumber(precomposedTx.totalSpent)
        .minus(precomposedTx.fee)
        .toString();

    if (isUpdatedEthereumSendFlow) {
        return [
            {
                id: 'amount', // In updated ethereum send flow there is no total amount shown, only amount without fee
                label: <Translation id="AMOUNT" />,
                value: tokenInfo
                    ? formatAmount(precomposedTx.totalSpent, tokenInfo.decimals)
                    : formatNetworkAmount(amountWithoutFee, symbol),
            },
            {
                id: 'fee',
                label: <Translation id="MAX_FEE" />,
                value: formatNetworkAmount(precomposedTx.fee, symbol),
            },
        ];
    }
    if (isUpdatedSendFlow) {
        return [
            {
                id: 'total',
                label: <Translation id={showAmountWithoutFee ? 'AMOUNT' : 'TR_TOTAL_AMOUNT'} />,
                value: tokenInfo
                    ? formatAmount(precomposedTx.totalSpent, tokenInfo.decimals)
                    : formatNetworkAmount(
                          showAmountWithoutFee ? amountWithoutFee : precomposedTx.totalSpent,
                          symbol,
                      ),
            },
            {
                id: 'fee',
                label: <Translation id={feeLabel} />,
                value: formatNetworkAmount(precomposedTx.fee, symbol),
            },
        ];
    }

    return [
        {
            id: 'total',
            label: <Translation id="TR_TOTAL" />,
            value: formatNetworkAmount(precomposedTx.totalSpent, symbol),
        },
    ];
};

export const TransactionReviewTotalOutput = forwardRef<
    HTMLDivElement,
    TransactionReviewTotalOutputProps
>(({ account, signedTx, outputs, buttonRequestsCount, precomposedTx }, ref) => {
    const device = useSelector(selectDevice);

    if (!device) {
        return null;
    }

    const { symbol, networkType } = account;

    const lines = getLines(device, networkType, symbol, precomposedTx);

    return (
        <TransactionReviewOutputElement
            account={account}
            indicator={
                <StepIndicator
                    signedTx={signedTx}
                    outputs={outputs}
                    buttonRequestsCount={buttonRequestsCount}
                />
            }
            lines={lines}
            cryptoSymbol={symbol}
            fiatSymbol={symbol}
            fiatVisible={!isTestnet(symbol)}
            ref={ref}
            token={precomposedTx?.token}
        />
    );
});
