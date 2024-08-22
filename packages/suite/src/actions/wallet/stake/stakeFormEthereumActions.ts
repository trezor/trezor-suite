import { BigNumber } from '@trezor/utils/src/bigNumber';
import { toWei } from 'web3-utils';

import TrezorConnect, { FeeLevel } from '@trezor/connect';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    calculateTotal,
    calculateMax,
    calculateEthFee,
    getExternalComposeOutput,
    formatAmount,
    isPending,
    getAccountIdentity,
} from '@suite-common/wallet-utils';
import {
    StakeFormState,
    PrecomposedLevels,
    PrecomposedTransaction,
    PrecomposedTransactionFinal,
    ExternalOutput,
} from '@suite-common/wallet-types';
import { selectDevice } from '@suite-common/wallet-core';

import { Dispatch, GetState } from 'src/types/suite';
import { selectAddressDisplayType } from 'src/reducers/suite/suiteReducer';
import { AddressDisplayOptions } from '@suite-common/wallet-types';

import {
    getStakeTxGasLimit,
    prepareClaimEthTx,
    prepareStakeEthTx,
    prepareUnstakeEthTx,
} from 'src/utils/suite/stake';
import {
    MIN_ETH_AMOUNT_FOR_STAKING,
    MIN_ETH_BALANCE_FOR_STAKING,
    MIN_ETH_FOR_WITHDRAWALS,
} from 'src/constants/suite/ethStaking';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { ComposeActionContext } from '@suite-common/wallet-core';

const calculate = (
    availableBalance: string,
    output: ExternalOutput,
    feeLevel: FeeLevel,
    compareWithAmount = true,
    symbol: NetworkSymbol,
): PrecomposedTransaction => {
    const feeInWei = calculateEthFee(toWei(feeLevel.feePerUnit, 'gwei'), feeLevel.feeLimit || '0');

    let amount: string;
    let max: string | undefined;

    if (output.type === 'send-max' || output.type === 'send-max-noaddress') {
        const minEthBalanceForStakingWei = toWei(MIN_ETH_BALANCE_FOR_STAKING.toString(), 'ether');
        const minAmountWithFeeWei = new BigNumber(minEthBalanceForStakingWei).plus(feeInWei);

        if (new BigNumber(availableBalance).lt(minAmountWithFeeWei)) {
            max = toWei(MIN_ETH_AMOUNT_FOR_STAKING.toString(), 'ether');
        } else {
            max = new BigNumber(calculateMax(availableBalance, feeInWei))
                .minus(toWei(MIN_ETH_FOR_WITHDRAWALS.toString(), 'ether'))
                .toString();
        }

        amount = max;
    } else {
        amount = output.amount;
    }

    // total ETH spent (amount + fee), in ERC20 only fee
    const totalSpent = new BigNumber(calculateTotal(amount, feeInWei));

    if (
        new BigNumber(feeInWei).gt(availableBalance) ||
        (compareWithAmount && totalSpent.isGreaterThan(availableBalance))
    ) {
        const error = 'TR_STAKE_NOT_ENOUGH_FUNDS';

        // errorMessage declared later
        return {
            type: 'error',
            error,
            errorMessage: { id: error, values: { symbol: symbol.toUpperCase() } },
        } as const;
    }

    const payloadData = {
        type: 'nonfinal' as const,
        totalSpent: totalSpent.toString(),
        max,
        fee: feeInWei,
        feePerByte: feeLevel.feePerUnit,
        feeLimit: feeLevel.feeLimit,
        bytes: 0, // TODO: calculate
        inputs: [],
    };

    if (output.type === 'send-max' || output.type === 'payment') {
        return {
            ...payloadData,
            type: 'final',
            // compatibility with BTC PrecomposedTransaction from @trezor/connect
            inputs: [],
            outputsPermutation: [0],
            outputs: [
                {
                    address: output.address,
                    amount,
                    script_type: 'PAYTOADDRESS',
                },
            ],
        };
    }

    return payloadData;
};

export const composeTransaction =
    (formValues: StakeFormState, formState: ComposeActionContext) => async () => {
        const { account, network, feeInfo } = formState;
        const composeOutputs = getExternalComposeOutput(formValues, account, network);
        if (!composeOutputs) return; // no valid Output

        const { output, decimals } = composeOutputs;
        const { availableBalance } = account;
        const { amount } = formValues.outputs[0];

        // gasLimit calculation based on account.descriptor and amount
        const { ethereumStakeType } = formValues;
        const stakeTxGasLimit = await getStakeTxGasLimit({
            ethereumStakeType,
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

        // wrap response into PrecomposedLevels object where key is a FeeLevel label
        const wrappedResponse: PrecomposedLevels = {};
        const compareWithAmount = formValues.ethereumStakeType === 'stake';
        const response = predefinedLevels.map(level =>
            calculate(availableBalance, output, level, compareWithAmount, account.symbol),
        );
        response.forEach((tx, index) => {
            const feeLabel = predefinedLevels[index].label as FeeLevel['label'];
            wrappedResponse[feeLabel] = tx;
        });

        // format max (calculate sends it as satoshi)
        // update errorMessage values (symbol)
        Object.keys(wrappedResponse).forEach(key => {
            const tx = wrappedResponse[key];
            if (tx.type !== 'error') {
                tx.max = tx.max ? formatAmount(tx.max, decimals) : undefined;
                tx.estimatedFeeLimit = customFeeLimit;
            }
            if (tx.type === 'error' && tx.error === 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE') {
                tx.errorMessage = {
                    id: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE',
                    values: { symbol: network.symbol.toUpperCase() },
                };
            }
        });

        return wrappedResponse;
    };

export const signTransaction =
    (formValues: StakeFormState, transactionInfo: PrecomposedTransactionFinal) =>
    async (dispatch: Dispatch, getState: GetState) => {
        const { selectedAccount, transactions } = getState().wallet;
        const device = selectDevice(getState());
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
        const { ethereumStakeType } = formValues;
        let txData;
        if (ethereumStakeType === 'stake') {
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
        if (ethereumStakeType === 'unstake') {
            txData = await prepareUnstakeEthTx({
                symbol: account.symbol,
                from: account.descriptor,
                identity,
                amount: formValues.outputs[0].amount,
                gasPrice: transactionInfo.feePerByte,
                nonce,
                chainId: network.chainId,
                interchanges: 0,
            });
        }
        if (ethereumStakeType === 'claim') {
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
