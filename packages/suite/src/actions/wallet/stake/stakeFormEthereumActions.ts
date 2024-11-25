import { toWei } from 'web3-utils';

import { BigNumber } from '@trezor/utils/src/bigNumber';
import TrezorConnect, { FeeLevel } from '@trezor/connect';
import { notificationsActions } from '@suite-common/toast-notifications';
import { calculateEthFee, isPending, getAccountIdentity } from '@suite-common/wallet-utils';
import {
    StakeFormState,
    PrecomposedTransaction,
    PrecomposedTransactionFinal,
    ExternalOutput,
    AddressDisplayOptions,
} from '@suite-common/wallet-types';
import {
    MIN_ETH_AMOUNT_FOR_STAKING,
    MIN_ETH_BALANCE_FOR_STAKING,
    MIN_ETH_FOR_WITHDRAWALS,
    UNSTAKE_INTERCHANGES,
} from '@suite-common/wallet-constants';
import { selectSelectedDevice, ComposeActionContext } from '@suite-common/wallet-core';
import type { NetworkSymbol } from '@suite-common/wallet-config';

import { Dispatch, GetState } from 'src/types/suite';
import { selectAddressDisplayType } from 'src/reducers/suite/suiteReducer';
import {
    getStakeTxGasLimit,
    prepareClaimEthTx,
    prepareStakeEthTx,
    prepareUnstakeEthTx,
} from 'src/utils/suite/ethereumStaking';

import { calculate, composeStakingTransaction } from './stakeFormActions';

const calculateTransaction = (
    availableBalance: string,
    output: ExternalOutput,
    feeLevel: FeeLevel,
    compareWithAmount = true,
    symbol: NetworkSymbol,
): PrecomposedTransaction => {
    const feeInWei = calculateEthFee(toWei(feeLevel.feePerUnit, 'gwei'), feeLevel.feeLimit || '0');

    const stakingParams = {
        feeInBaseUnits: feeInWei,
        minBalanceForStakingInBaseUnits: toWei(MIN_ETH_BALANCE_FOR_STAKING.toString(), 'ether'),
        minAmountForStakingInBaseUnits: toWei(MIN_ETH_AMOUNT_FOR_STAKING.toString(), 'ether'),
        minAmountForWithdrawalInBaseUnits: toWei(MIN_ETH_FOR_WITHDRAWALS.toString(), 'ether'),
    };

    return calculate(availableBalance, output, feeLevel, compareWithAmount, symbol, stakingParams);
};

export const composeTransaction =
    (formValues: StakeFormState, formState: ComposeActionContext) => async () => {
        const { account, feeInfo } = formState;
        if (!account || !feeInfo) return;

        const { amount } = formValues.outputs[0];

        // gasLimit calculation based on account.descriptor and amount
        const { stakeType } = formValues;
        const stakeTxGasLimit = await getStakeTxGasLimit({
            stakeType,
            from: account.descriptor,
            amount,
            symbol: account.symbol,
            identity: getAccountIdentity(account),
        });

        if (!stakeTxGasLimit.success) return stakeTxGasLimit.error;

        const customFeeLimit = stakeTxGasLimit.gasLimit;

        // FeeLevels are read-only
        const levels = customFeeLimit ? feeInfo.levels.map(l => ({ ...l })) : feeInfo.levels;
        const predefinedLevels = levels.filter(l => l.label !== 'custom');
        // update predefined levels with customFeeLimit (gasLimit from data size or erc20 transfer)
        if (customFeeLimit) {
            predefinedLevels.forEach(l => (l.feeLimit = customFeeLimit));
        }
        // in case when selectedFee is set to 'custom' construct this FeeLevel from values
        if (formValues.selectedFee === 'custom') {
            predefinedLevels.push({
                label: 'custom',
                feePerUnit: formValues.feePerUnit,
                feeLimit: formValues.feeLimit,
                blocks: -1,
            });
        }

        return composeStakingTransaction(
            formValues,
            formState,
            predefinedLevels,
            calculateTransaction,
            customFeeLimit,
        );
    };

export const signTransaction =
    (formValues: StakeFormState, transactionInfo: PrecomposedTransactionFinal) =>
    async (dispatch: Dispatch, getState: GetState) => {
        const { selectedAccount, transactions } = getState().wallet;
        const device = selectSelectedDevice(getState());
        if (
            selectedAccount.status !== 'loaded' ||
            !device ||
            !transactionInfo ||
            transactionInfo.type !== 'final'
        )
            return;

        const { account, network } = selectedAccount;
        if (account.networkType !== 'ethereum' || !network.chainId) return;

        const addressDisplayType = selectAddressDisplayType(getState());

        // Ethereum account `misc.nonce` is not updated before pending tx is mined
        // Calculate `pendingNonce`: greatest value in pending tx + 1
        // This may lead to unexpected/unwanted behavior
        // whenever pending tx gets rejected all following txs (with higher nonce) will be rejected as well
        const pendingTxs = (transactions.transactions[account.key] || []).filter(isPending);
        const pendingNonce = pendingTxs.reduce((value, tx) => {
            if (!tx.ethereumSpecific) return value;

            return Math.max(value, tx.ethereumSpecific.nonce + 1);
        }, 0);
        const pendingNonceBig = new BigNumber(pendingNonce);
        let nonce =
            pendingNonceBig.gt(0) && pendingNonceBig.gt(account.misc.nonce)
                ? pendingNonceBig.toString()
                : account.misc.nonce;

        if (formValues.rbfParams && typeof formValues.rbfParams.ethereumNonce === 'number') {
            nonce = formValues.rbfParams.ethereumNonce.toString();
        }

        const identity = getAccountIdentity(account);

        // transform to TrezorConnect.ethereumSignTransaction params
        const { stakeType } = formValues;
        let txData;
        if (stakeType === 'stake') {
            txData = await prepareStakeEthTx({
                symbol: account.symbol,
                from: account.descriptor,
                identity,
                amount: formValues.outputs[0].amount,
                gasPrice: transactionInfo.feePerByte,
                nonce,
                chainId: network.chainId,
            });
        }
        if (stakeType === 'unstake') {
            txData = await prepareUnstakeEthTx({
                symbol: account.symbol,
                from: account.descriptor,
                identity,
                amount: formValues.outputs[0].amount,
                gasPrice: transactionInfo.feePerByte,
                nonce,
                chainId: network.chainId,
                interchanges: UNSTAKE_INTERCHANGES,
            });
        }
        if (stakeType === 'claim') {
            txData = await prepareClaimEthTx({
                symbol: account.symbol,
                from: account.descriptor,
                identity,
                gasPrice: transactionInfo.feePerByte,
                nonce,
                chainId: network.chainId,
            });
        }

        if (!txData) {
            dispatch(
                notificationsActions.addToast({
                    type: 'sign-tx-error',
                    error: 'Unknown stake action',
                }),
            );

            return;
        }

        if (!txData.success) {
            dispatch(
                notificationsActions.addToast({
                    type: 'sign-tx-error',
                    error: txData.errorMessage,
                }),
            );

            return;
        }

        const signedTx = await TrezorConnect.ethereumSignTransaction({
            device: {
                path: device.path,
                instance: device.instance,
                state: device.state,
            },
            useEmptyPassphrase: device.useEmptyPassphrase,
            path: account.path,
            transaction: txData.tx,
            chunkify: addressDisplayType === AddressDisplayOptions.CHUNKED,
        });

        if (!signedTx.success) {
            // catch manual error from TransactionReviewModal
            if (signedTx.payload.error === 'tx-cancelled') return;
            dispatch(
                notificationsActions.addToast({
                    type: 'sign-tx-error',
                    error: signedTx.payload.error,
                }),
            );

            return;
        }

        return signedTx.payload.serializedTx;
    };
