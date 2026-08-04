import { Translation, useTranslation } from '@suite/intl';
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
    getEvmTransactionTextSignature,
    getIsUpdatedEthereumSendFlow,
    getIsUpdatedSendFlow,
    isClearSignedEvmTradingSwapTransaction,
    isClearSignedWrappedNativeTransaction,
    isEvmApprovalTx,
    isEvmYieldTxByTextSignature,
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
    isClearSignedTradingSwap: boolean;
    isClearSignedWrapUnwrap: boolean;
    isTronStakeFreeze: boolean;
    tronResourceLabel: string;
}

const getLines = ({
    device,
    networkType,
    precomposedTx,
    precomposedForm,
    isRbfAction,
    stakeType,
    nativeToken,
    isClearSignedTradingSwap,
    isClearSignedWrapUnwrap,
    isTronStakeFreeze,
    tronResourceLabel,
}: GetLinesParams): OutputElementLine[] => {
    const isUpdatedSendFlow = getIsUpdatedSendFlow(device);
    const isUpdatedEthereumSendFlow = getIsUpdatedEthereumSendFlow(device, networkType, stakeType);
    const isEthereum = networkType === 'ethereum';
    const isSolana = networkType === 'solana';
    const showAmountWithoutFee = isEthereum || isSolana;
    const evmTxType = getEvmTransactionTextSignature(precomposedForm.transactionData);
    const isYieldOrClaimOperation = isEvmYieldTxByTextSignature(evmTxType) || evmTxType === 'claim';

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

    if (isTronStakeFreeze) {
        return [
            {
                id: 'amount',
                label: <Translation id="AMOUNT" />,
                value: amountWithoutFee,
                type: 'amount',
            },
            {
                id: 'resource',
                label: <Translation id="TR_TRON_RESOURCE" />,
                value: tronResourceLabel,
                type: 'default',
            },
        ];
    }

    if (precomposedForm.trading?.isSlip24Active || isClearSignedTradingSwap) {
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

        const isFeeOnly =
            isUnknownStakingValue ||
            (isEvmApprovalTx(precomposedForm.transactionData) && isApprovalFlowSupported(device)) ||
            isYieldOrClaimOperation ||
            // A clear-signed wrap/unwrap already confirms the amount on its own row, and the
            // device leaves it off its summary screen for the same reason.
            isClearSignedWrapUnwrap;

        return isFeeOnly ? [feeLine] : [amountLine, feeLine];
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

    const totalLine: OutputElementLine = {
        id: 'total',
        label: <Translation id="TR_TOTAL" />,
        value: precomposedTx.totalSpent,
        token: tokenInfo,
        type: 'amount',
    };

    if (isYieldOrClaimOperation) {
        return [
            totalLine,
            {
                id: 'fee',
                label: <Translation id={feeLabelId} />,
                value: precomposedTx.fee,
                type: 'amount',
            },
        ];
    }

    return [totalLine];
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
    const { translationString } = useTranslation();

    if (!device) {
        return null;
    }

    const { networkType } = account;
    const { tronStaking } = precomposedForm;
    const isTronStakeFreeze =
        networkType === 'tron' &&
        (tronStaking?.kind === 'freeze' || tronStaking?.kind === 'unstake');
    const tronResourceLabel =
        (tronStaking?.kind === 'freeze' || tronStaking?.kind === 'unstake') &&
        tronStaking.resource === 'energy'
            ? translationString('TR_TRON_ENERGY')
            : translationString('TR_TRON_BANDWIDTH');
    const nativeToken =
        account.accountType === 'placeholder' && 'nativeToken' in precomposedTx
            ? precomposedTx.nativeToken
            : undefined;
    const isFiatVisible = !isTestnet(account.symbol) && account.accountType !== 'placeholder';
    const isClearSignedTradingSwap = isClearSignedEvmTradingSwapTransaction({
        account,
        device,
        precomposedTx,
        transactionData: precomposedForm.transactionData,
        trading: precomposedForm.trading,
    });
    const isClearSignedWrapUnwrap = isClearSignedWrappedNativeTransaction({
        account,
        device,
        precomposedTx,
        transactionData: precomposedForm.transactionData,
    });
    const lines = getLines({
        device,
        networkType,
        precomposedTx,
        precomposedForm,
        isRbfAction: isRbf,
        stakeType,
        nativeToken,
        isClearSignedTradingSwap,
        isClearSignedWrapUnwrap,
        isTronStakeFreeze,
        tronResourceLabel,
    });

    const titleId = (() => {
        // Both list the fee alone, so "Total including fee" would be misleading.
        if (isClearSignedTradingSwap || isClearSignedWrapUnwrap) return 'TR_NETWORK_FEE';
        if (precomposedForm.trading?.isSlip24Active) return 'TR_SUMMARY';
        if (isTronStakeFreeze) return 'TR_SUMMARY';

        return 'TR_TOTAL_INCLUDING_FEE';
    })();

    return (
        <TransactionReviewOutputElement
            title={<Translation id={titleId} />}
            account={account}
            lines={lines}
            state={state}
            fiatVisible={isFiatVisible}
        />
    );
};
