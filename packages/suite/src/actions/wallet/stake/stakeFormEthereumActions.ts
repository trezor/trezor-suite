import BigNumber from 'bignumber.js';
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
} from '@suite-common/wallet-utils';
import {
    StakeFormState,
    ComposeActionContext,
    PrecomposedLevels,
    PrecomposedTransaction,
    PrecomposedTransactionFinal,
    ExternalOutput,
} from '@suite-common/wallet-types';
import { selectDevice } from '@suite-common/wallet-core';

import { Dispatch, GetState } from 'src/types/suite';
import { AddressDisplayOptions, selectAddressDisplayType } from 'src/reducers/suite/suiteReducer';

import { getEthNetworkForWalletSdk, prepareStakeEthTx } from 'src/utils/suite/stake';
// @ts-expect-error
import { Ethereum } from '@everstake/wallet-sdk';
import { MIN_ETH_FOR_WITHDRAWALS, WALLET_SDK_SOURCE } from 'src/constants/suite/ethStaking';

const calculate = (
    availableBalance: string,
    output: ExternalOutput,
    feeLevel: FeeLevel,
    compareWithAmount = true,
): PrecomposedTransaction => {
    const feeInSatoshi = calculateEthFee(
        toWei(feeLevel.feePerUnit, 'gwei'),
        feeLevel.feeLimit || '0',
    );

    let amount: string;
    let max: string | undefined;

    if (output.type === 'send-max' || output.type === 'send-max-noaddress') {
        max = new BigNumber(calculateMax(availableBalance, feeInSatoshi))
            .minus(toWei(MIN_ETH_FOR_WITHDRAWALS.toString()))
            .toString();
        amount = max;
    } else {
        amount = output.amount;
    }

    // total ETH spent (amount + fee), in ERC20 only fee
    const totalSpent = new BigNumber(calculateTotal(amount, feeInSatoshi));

    if (
        new BigNumber(feeInSatoshi).gt(availableBalance) ||
        (compareWithAmount && totalSpent.isGreaterThan(availableBalance))
    ) {
        const error = 'AMOUNT_IS_NOT_ENOUGH';
        // errorMessage declared later
        return { type: 'error', error, errorMessage: { id: error } } as const;
    }

    const payloadData = {
        type: 'nonfinal' as const,
        totalSpent: totalSpent.toString(),
        max,
        fee: feeInSatoshi,
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

        let customFeeLimit: string | undefined;

        // tx data with gasLimit calculation based on account.descriptor and amount
        let txData;
        const genericError: PrecomposedLevels = {
            normal: {
                error: 'INCORRECT-FEE-RATE',
                errorMessage: { id: 'TR_GENERIC_ERROR_TITLE' },
                type: 'error',
            },
        };
        try {
            Ethereum.selectNetwork(getEthNetworkForWalletSdk(account.symbol));
            // TODO: Implement tx type switcher
            txData = await Ethereum.stake(account.descriptor, amount, WALLET_SDK_SOURCE);
        } catch (e) {
            console.error(e);
            return genericError;
        }

        if (!txData) return genericError;

        customFeeLimit = txData.gas;
        if (formValues.ethereumAdjustGasLimit && customFeeLimit) {
            customFeeLimit = new BigNumber(customFeeLimit)
                .multipliedBy(new BigNumber(formValues.ethereumAdjustGasLimit))
                .toFixed(0);
        }

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
            calculate(availableBalance, output, level, compareWithAmount),
        );
        response.forEach((tx, index) => {
            const feeLabel = predefinedLevels[index].label as FeeLevel['label'];
            wrappedResponse[feeLabel] = tx;
        });

        // TODO: Implement adding custom fees.
        // const hasAtLeastOneValid = response.find(r => r.type !== 'error');
        // there is no valid tx in predefinedLevels and there is no custom level
        // if (!hasAtLeastOneValid && !wrappedResponse.custom) {
        //     const { minFee } = feeInfo;
        //     const lastKnownFee = predefinedLevels[predefinedLevels.length - 1].feePerUnit;
        //     let maxFee = new BigNumber(lastKnownFee).minus(1);
        //     // generate custom levels in range from lastKnownFee - 1 to feeInfo.minFee (coinInfo in @trezor/connect)
        //     const customLevels: FeeLevel[] = [];
        //     while (maxFee.gte(minFee)) {
        //         customLevels.push({
        //             feePerUnit: maxFee.toString(),
        //             feeLimit: predefinedLevels[0].feeLimit,
        //             label: 'custom',
        //             blocks: -1,
        //         });
        //         maxFee = maxFee.minus(1);
        //     }
        //
        //     // check if any custom level is possible
        //     const customLevelsResponse = customLevels.map(level =>
        //         calculate(availableBalance, output, level, compareWithAmount),
        //     );
        //
        //     const customValid = customLevelsResponse.findIndex(r => r.type !== 'error');
        //     if (customValid >= 0) {
        //         wrappedResponse.custom = customLevelsResponse[customValid];
        //     }
        // }

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

        // transform to TrezorConnect.ethereumSignTransaction params
        const txData = await prepareStakeEthTx({
            symbol: account.symbol,
            from: account.descriptor,
            amount: formValues.outputs[0].amount,
            gasPrice: transactionInfo.feePerByte,
            nonce,
            chainId: network.chainId,
        });

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
