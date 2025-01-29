import { BigNumber } from '@trezor/utils/src/bigNumber';
import {
    isTestnet,
    getIsUpdatedSendFlow,
    getIsUpdatedEthereumSendFlow,
} from '@suite-common/wallet-utils';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import { Account, GeneralPrecomposedTransactionFinal, StakeType } from '@suite-common/wallet-types';
import { BulletListItemState } from '@trezor/components';
import { NetworkType } from '@suite-common/wallet-config';

import { TrezorDevice } from 'src/types/suite';
import { Translation } from 'src/components/suite/Translation';
import { useSelector } from 'src/hooks/suite/useSelector';

import {
    TransactionReviewOutputElement,
    OutputElementLine,
} from './TransactionReviewOutputElement';

const getLines = (
    device: TrezorDevice,
    networkType: NetworkType,
    precomposedTx: GeneralPrecomposedTransactionFinal,
    isRbfAction?: boolean,
    stakeType?: StakeType,
): OutputElementLine[] => {
    const isUpdatedSendFlow = getIsUpdatedSendFlow(device);
    const isUpdatedEthereumSendFlow = getIsUpdatedEthereumSendFlow(device, networkType);
    const isEthereum = networkType === 'ethereum';
    const isSolana = networkType === 'solana';
    const showAmountWithoutFee = isEthereum || isSolana;
    const feeLabel = ((network: NetworkType) => {
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
        const isUnknownStakingClaimValue = isRbfAction && stakeType === 'claim';

        const amountLine: OutputElementLine = {
            id: 'amount', // In updated ethereum send flow there is no total amount shown, only amount without fee
            label: <Translation id="AMOUNT" />,
            value: tokenInfo ? precomposedTx.totalSpent : amountWithoutFee,
            type: 'amount',
        };

        const feeLine: OutputElementLine = {
            id: 'fee',
            label: <Translation id="MAX_FEE" />,
            value: precomposedTx.fee,
            type: 'fee',
        };

        return isUnknownStakingClaimValue ? [feeLine] : [amountLine, feeLine];
    }
    if (isUpdatedSendFlow) {
        const amount = showAmountWithoutFee ? amountWithoutFee : precomposedTx.totalSpent;

        return [
            {
                id: 'total',
                label: <Translation id={showAmountWithoutFee ? 'AMOUNT' : 'TR_TOTAL_AMOUNT'} />,
                value: tokenInfo ? precomposedTx.totalSpent : amount,
                type: 'total',
            },
            {
                id: 'fee',
                label: <Translation id={feeLabel} />,
                value: precomposedTx.fee,
                type: 'fee',
            },
        ];
    }

    return [
        {
            id: 'total',
            label: <Translation id="TR_TOTAL" />,
            value: precomposedTx.totalSpent,
            type: 'total',
        },
    ];
};

export type TransactionReviewTotalOutputProps = {
    state: BulletListItemState;
    precomposedTx: GeneralPrecomposedTransactionFinal;
    account: Account;
    isRbf: boolean;
    stakeType?: StakeType;
};

export const TransactionReviewTotalOutput = ({
    account,
    state,
    precomposedTx,
    stakeType,
    isRbf,
}: TransactionReviewTotalOutputProps) => {
    const device = useSelector(selectSelectedDevice);

    if (!device) {
        return null;
    }

    const { networkType, symbol } = account;
    const lines = getLines(device, networkType, precomposedTx, isRbf, stakeType);

    return (
        <TransactionReviewOutputElement
            title={<Translation id="TR_TOTAL_INCLUDING_FEE" />}
            account={account}
            lines={lines}
            state={state}
            fiatVisible={!isTestnet(symbol)}
            token={precomposedTx?.token}
        />
    );
};
