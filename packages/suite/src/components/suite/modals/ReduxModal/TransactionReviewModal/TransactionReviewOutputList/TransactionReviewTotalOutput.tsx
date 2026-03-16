import { Translation } from '@suite/intl';
import { isApprovalFlowSupported, selectSelectedDevice } from '@suite-common/device';
import { type NetworkType } from '@suite-common/wallet-config';
import {
    type Account,
    type FormState,
    type GeneralPrecomposedTransactionFinal,
    type StakeFormState,
    type StakeType,
} from '@suite-common/wallet-types';
import {
    getIsUpdatedEthereumSendFlow,
    getIsUpdatedSendFlow,
    isEvmApprovalTx,
    isTestnet,
} from '@suite-common/wallet-utils';
import type { TokenInfo } from '@trezor/blockchain-link-types';
import { BigNumber } from '@trezor/utils';

import { useSelector } from 'src/hooks/suite/useSelector';
import { type TrezorDevice } from 'src/types/suite';

import {
    type OutputElementLine,
    TransactionReviewOutputElement,
    type TransactionReviewOutputElementProps,
} from './TransactionReviewOutputElement';

interface GetLinesParams {
    device: TrezorDevice;
    networkType: NetworkType;
    precomposedTx: GeneralPrecomposedTransactionFinal;
    precomposedForm: FormState | StakeFormState;
    isRbfAction?: boolean;
    stakeType?: StakeType;
    nativeToken?: TokenInfo;
}

const getLines = ({
    device,
    networkType,
    precomposedTx,
    precomposedForm,
    isRbfAction,
    stakeType,
    nativeToken,
}: GetLinesParams): OutputElementLine[] => {
    const isUpdatedSendFlow = getIsUpdatedSendFlow(device);
    const isUpdatedEthereumSendFlow = getIsUpdatedEthereumSendFlow(device, networkType, stakeType);
    const isEthereum = networkType === 'ethereum';
    const isSolana = networkType === 'solana';
    const showAmountWithoutFee = isEthereum || isSolana;

    const feeLabelId = ((network: NetworkType) => {
        switch (network) {
            case 'ethereum':
                return 'MAX_FEE';
            case 'stellar':
                return 'MAX_FEE';
            case 'solana':
                return 'TR_TX_FEE_INCLUDING_RENT';
            default:
                return 'TR_INCLUDING_FEE';
        }
    })(networkType);
    const tokenInfo = precomposedTx?.token;
    const amountWithoutFee = new BigNumber(precomposedTx.totalSpent)
        .minus(precomposedTx.fee)
        .toString();

    if (precomposedForm.trading?.isSlip24Active) {
        return [
            {
                id: 'fee',
                label: <Translation id={feeLabelId} />,
                value: precomposedTx.fee,
                type: 'amount',
            },
        ];
    }

    if (isUpdatedEthereumSendFlow) {
        const isUnknownStakingValue = isRbfAction && stakeType !== 'stake';

        const amountLine: OutputElementLine = {
            id: 'amount', // In updated ethereum send flow there is no total amount shown, only amount without fee
            label: <Translation id="AMOUNT" />,
            value: tokenInfo ? precomposedTx.totalSpent : amountWithoutFee,
            token: tokenInfo ?? nativeToken,
            type: 'amount',
        };

        const feeLine: OutputElementLine = {
            id: 'fee',
            label: <Translation id="MAX_FEE" />,
            value: precomposedTx.fee,
            token: nativeToken,
            type: 'amount',
        };

        return isUnknownStakingValue ||
            (isEvmApprovalTx(precomposedForm.transactionData) && isApprovalFlowSupported(device))
            ? [feeLine]
            : [amountLine, feeLine];
    }
    if (isUpdatedSendFlow) {
        const amount = showAmountWithoutFee ? amountWithoutFee : precomposedTx.totalSpent;

        return [
            {
                id: 'total',
                label: <Translation id={showAmountWithoutFee ? 'AMOUNT' : 'TR_TOTAL_AMOUNT'} />,
                value: tokenInfo ? precomposedTx.totalSpent : amount,
                token: tokenInfo,
                type: 'amount',
            },
            {
                id: 'fee',
                label: <Translation id={feeLabelId} />,
                value: precomposedTx.fee,
                type: 'amount',
            },
        ];
    }

    return [
        {
            id: 'total',
            label: <Translation id="TR_TOTAL" />,
            value: precomposedTx.totalSpent,
            token: tokenInfo,
            type: 'amount',
        },
    ];
};

export type TransactionReviewTotalOutputProps = {
    state: TransactionReviewOutputElementProps['state'];
    precomposedTx: GeneralPrecomposedTransactionFinal;
    precomposedForm: FormState | StakeFormState;
    account: Account;
    isRbf: boolean;
    stakeType?: StakeType;
};

export const TransactionReviewTotalOutput = ({
    account,
    state,
    precomposedTx,
    precomposedForm,
    stakeType,
    isRbf,
}: TransactionReviewTotalOutputProps) => {
    const device = useSelector(selectSelectedDevice);

    if (!device) {
        return null;
    }

    const { networkType } = account;
    const nativeToken =
        account.accountType === 'placeholder' && 'nativeToken' in precomposedTx
            ? precomposedTx.nativeToken
            : undefined;
    const isFiatVisible = !isTestnet(account.symbol) && account.accountType !== 'placeholder';
    const lines = getLines({
        device,
        networkType,
        precomposedTx,
        precomposedForm,
        isRbfAction: isRbf,
        stakeType,
        nativeToken,
    });

    return (
        <TransactionReviewOutputElement
            title={
                precomposedForm.trading?.isSlip24Active ? (
                    <Translation id="TR_SUMMARY" />
                ) : (
                    <Translation id="TR_TOTAL_INCLUDING_FEE" />
                )
            }
            account={account}
            lines={lines}
            state={state}
            fiatVisible={isFiatVisible}
        />
    );
};
