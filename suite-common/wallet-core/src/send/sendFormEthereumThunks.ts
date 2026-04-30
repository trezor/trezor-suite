import { fromWei, toWei } from 'web3-utils';

import { isApprovalFlowSupported, selectSelectedDevice } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { getNetwork, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT,
    ETH_TRANSFER_BACKUP_GAS_LIMIT,
    STAKE_GAS_LIMIT_RESERVE,
} from '@suite-common/wallet-constants';
import {
    type Account,
    AddressDisplayOptions,
    type ComposeActionContext,
    type ExternalOutput,
    type PrecomposedLevels,
    type PrecomposedTransaction,
    type RbfTransactionParams,
} from '@suite-common/wallet-types';
import {
    asAmountSubunit,
    asAmountUnit,
    calculateMax,
    calculateTotal,
    calculateTotalGasCost,
    convertAmountSubunitsToUnits,
    convertAmountUnitsToSubunits,
    getAccountIdentity,
    getApprovalComposeOutput,
    getCryptoMaxAmountWithReserve,
    getEthereumEstimateFeeParams,
    getExternalComposeOutput,
    getTxStakeNameByDataHex,
    isEvmApprovalTx,
    isPending,
    isSentTransaction,
    prepareEthereumTransaction,
    subunitsToUnits,
    unitsToSubunits,
} from '@suite-common/wallet-utils';
import TrezorConnect, { type FeeLevel, type TokenInfo } from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

import { SEND_MODULE_PREFIX } from './sendFormConstants';
import {
    type ComposeFeeLevelsError,
    type ComposeTransactionThunkArguments,
    type SignTransactionError,
    type SignTransactionThunkArguments,
} from './sendFormTypes';
import { selectAddressDisplayType } from '../settings/walletSettingsReducer';
import { selectTransactions } from '../transactions/transactionsSelectors';

export const calculate = (
    availableBalance: string,
    output: ExternalOutput,
    feeLevel: FeeLevel,
    token?: TokenInfo,
    composeContext?: ComposeActionContext,
    isNetworkReserveEnabled = false,
): PrecomposedTransaction => {
    let amount: string;
    let max: string | undefined;

    const totalGasCostInWei = calculateTotalGasCost(
        toWei(feeLevel.maxFeePerGas || feeLevel.feePerUnit, 'gwei'),
        feeLevel.feeLimit,
    );

    const availableTokenBalance = token
        ? convertAmountUnitsToSubunits(token.balance!, token.decimals)
        : undefined;

    if (output.type === 'send-max' || output.type === 'send-max-noaddress') {
        max = availableTokenBalance || calculateMax(availableBalance, totalGasCostInWei);

        if (composeContext) {
            const feesInUnits = subunitsToUnits({
                value: asAmountSubunit(new BigNumber(totalGasCostInWei)),
                symbol: composeContext.account.symbol,
            }).toString();

            const maxInUnits = subunitsToUnits({
                value: asAmountSubunit(new BigNumber(max)),
                symbol: composeContext.account.symbol,
            }).toString();

            max = getCryptoMaxAmountWithReserve({
                symbol: composeContext.account.symbol,
                contractAddress: token?.contract,
                balance: composeContext.account.formattedBalance,
                amount: maxInUnits,
                fee: feesInUnits,
                isNetworkReserveEnabled,
            });

            max = unitsToSubunits({
                value: asAmountUnit(new BigNumber(max)),
                symbol: composeContext.account.symbol,
            }).toString();
        }

        amount = max;
    } else {
        amount = output.amount;
    }

    // total ETH spent (amount + fee), in ERC20 only fee
    const totalSpent = new BigNumber(calculateTotal(token ? '0' : amount, totalGasCostInWei));

    if (totalSpent.isGreaterThan(availableBalance)) {
        if (token) {
            return {
                type: 'error',
                error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE_WITH_ETH_AMOUNT',
                errorMessage: {
                    id: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE_WITH_ETH_AMOUNT',
                    values: {
                        feeAmount: fromWei(totalGasCostInWei, 'ether').toString(),
                    },
                },
            } as const;
        }

        return {
            type: 'error',
            error: 'AMOUNT_IS_NOT_ENOUGH',
            errorMessage: { id: 'AMOUNT_IS_NOT_ENOUGH' },
        } as const;
    }

    // validate if token balance is not 0 or lower than amount
    if (
        availableTokenBalance &&
        (availableTokenBalance === '0' || new BigNumber(amount).gt(availableTokenBalance))
    ) {
        return {
            type: 'error',
            error: 'AMOUNT_IS_NOT_ENOUGH',
            errorMessage: { id: 'AMOUNT_IS_NOT_ENOUGH' },
        } as const;
    }

    const payloadData = {
        type: 'nonfinal' as const,
        totalSpent: token ? amount : totalSpent.toString(),
        max,
        fee: totalGasCostInWei,
        maxFeePerGas: feeLevel.maxFeePerGas,
        maxPriorityFeePerGas: feeLevel.maxPriorityFeePerGas,
        feePerByte: feeLevel.feePerUnit,
        feeLimit: feeLevel.feeLimit,
        token,
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

export const composeEthereumTransactionFeeLevelsThunk = createThunk<
    PrecomposedLevels,
    ComposeTransactionThunkArguments,
    { rejectValue: ComposeFeeLevelsError }
>(
    `${SEND_MODULE_PREFIX}/composeEthereumTransactionFeeLevelsThunk`,
    async (
        { formState, composeContext, isNetworkReserveEnabled = false },
        { dispatch, rejectWithValue, getState },
    ) => {
        const device = selectSelectedDevice(getState());

        const { account, network, feeInfo } = composeContext;
        const { transactionData } = formState;

        const isApproveTx = isEvmApprovalTx(transactionData);
        const contract = isApprovalFlowSupported(device)
            ? (formState.outputs[0].token ?? undefined)
            : formState.outputs[0].address;

        if (isApproveTx && !contract) {
            return rejectWithValue({
                error: 'fee-levels-compose-failed',
                message: 'Unable to compose output.',
            });
        }

        const composedOutput = isApproveTx
            ? getApprovalComposeOutput(contract, account, network)
            : getExternalComposeOutput(formState, account, network);

        if (!composedOutput)
            return rejectWithValue({
                error: 'fee-levels-compose-failed',
                message: 'Unable to compose output.',
            });

        const { output, tokenInfo, decimals } = composedOutput;
        const { availableBalance } = account;
        const { address, amount } = formState.outputs[0];

        const ethereumEstimateFeeParams =
            isApproveTx && contract
                ? getEthereumEstimateFeeParams(contract, '0', undefined, formState.transactionData)
                : getEthereumEstimateFeeParams(
                      address || account.descriptor,
                      amount || (tokenInfo ? tokenInfo.balance! : account.formattedBalance),
                      tokenInfo,
                      formState.transactionData,
                  );

        // gasLimit calculation based on address, amount and data size
        // amount in essential for a proper calculation of gasLimit (via blockbook/geth)
        const estimatedFee = await TrezorConnect.blockchainEstimateFee({
            coin: account.symbol,
            identity: getAccountIdentity(account),
            request: {
                blocks: [2],
                specific: {
                    from: account.descriptor,
                    ...ethereumEstimateFeeParams,
                },
            },
        });

        let customFeeLimit: BigNumber;
        if (estimatedFee.success) {
            customFeeLimit = new BigNumber(estimatedFee.payload.levels[0].feeLimit || '');
        } else {
            customFeeLimit = new BigNumber(
                tokenInfo || transactionData
                    ? ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT
                    : ETH_TRANSFER_BACKUP_GAS_LIMIT,
            );
            dispatch(
                notificationsActions.addToast({
                    type: 'estimated-fee-error',
                }),
            );
        }

        // increase gas limit, this flow is used only for Invity
        if (formState.ethereumAdjustGasLimit) {
            customFeeLimit = customFeeLimit.multipliedBy(formState.ethereumAdjustGasLimit);
        }

        // increase gas limit for staking, this flow is used only during bump fee
        const isStakeEthTx = !!getTxStakeNameByDataHex(formState.transactionData);
        if (isStakeEthTx) {
            customFeeLimit = customFeeLimit.plus(STAKE_GAS_LIMIT_RESERVE);
        }

        // FeeLevels are read-only
        const levels = customFeeLimit ? feeInfo.levels.map(l => ({ ...l })) : feeInfo.levels;
        const predefinedLevels = levels.filter(l => l.label !== 'custom');
        // update predefined levels with customFeeLimit (gasLimit from data size or erc20 transfer)
        if (customFeeLimit.gt(0)) {
            predefinedLevels.forEach(l => (l.feeLimit = customFeeLimit.toFixed(0)));
        }
        // in case when selectedFee is set to 'custom' construct this FeeLevel from values
        if (formState.selectedFee === 'custom') {
            const { maxPriorityFeePerGas, maxFeePerGas, feePerUnit, feeLimit } = formState;

            predefinedLevels.push({
                label: 'custom',
                feePerUnit,
                feeLimit,
                maxPriorityFeePerGas,
                maxFeePerGas,
                blocks: -1,
            });
        }

        // wrap response into PrecomposedLevels object where key is a FeeLevel label
        const resultLevels: PrecomposedLevels = {};
        const response = predefinedLevels.map(level =>
            calculate(
                availableBalance,
                output,
                level,
                tokenInfo,
                composeContext,
                isNetworkReserveEnabled,
            ),
        );
        response.forEach((tx, index) => {
            const feeLabel = predefinedLevels[index].label as FeeLevel['label'];
            resultLevels[feeLabel] = tx;
        });

        // format max
        // update errorMessage values (symbol)
        Object.keys(resultLevels).forEach(key => {
            const tx = resultLevels[key];
            if (tx.type !== 'error') {
                tx.max = tx.max ? convertAmountSubunitsToUnits(tx.max, decimals) : undefined;
                tx.estimatedFeeLimit = !customFeeLimit.isNaN()
                    ? customFeeLimit.toFixed(0)
                    : undefined;
            }
            if (
                tx.type === 'error' &&
                tx.error === 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE_WITH_ETH_AMOUNT'
            ) {
                tx.errorMessage = {
                    values: {
                        networkDisplaySymbol: getNetworkDisplaySymbol(network.symbol),
                        feeAmount: tx.errorMessage?.values?.feeAmount || '',
                    },
                    id: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE_WITH_ETH_AMOUNT',
                };
            }
        });

        return resultLevels;
    },
);

export const ethereumGetCurrentNonceThunk = createThunk<
    { nonce: string },
    { selectedAccount: Account & { networkType: 'ethereum' }; rbfParams?: RbfTransactionParams }
>(
    `${SEND_MODULE_PREFIX}/ethereumGetCurrentNonceThunk`,
    ({ selectedAccount, rbfParams }, { getState }) => {
        // Ethereum account `misc.nonce` is not updated before pending tx is mined
        // Calculate `pendingNonce`: greatest value in pending tx + 1
        // This may lead to unexpected/unwanted behavior
        // whenever pending tx gets rejected all following txs (with higher nonce) will be rejected as well
        const transactions = selectTransactions(getState());
        const pendingTxs = (transactions[selectedAccount.key] || [])
            .filter(isPending)
            .filter(isSentTransaction);
        const pendingNonce = pendingTxs.reduce((value, tx) => {
            if (!tx.ethereumSpecific) return value;

            return Math.max(value, tx.ethereumSpecific.nonce + 1);
        }, 0);

        const pendingNonceBig = new BigNumber(pendingNonce);
        const accountNonce = selectedAccount.misc?.nonce;

        let nonce =
            pendingNonceBig.gt(0) && pendingNonceBig.gt(accountNonce)
                ? pendingNonceBig.toString()
                : accountNonce;

        if (rbfParams?.type === 'ethereum' && typeof rbfParams.ethereumNonce === 'number') {
            nonce = rbfParams.ethereumNonce.toString();
        }

        return { nonce };
    },
);

export const signEthereumSendFormTransactionThunk = createThunk<
    { serializedTx: string },
    SignTransactionThunkArguments,
    { rejectValue: SignTransactionError }
>(
    `${SEND_MODULE_PREFIX}/signEthereumSendFormTransactionThunk`,
    async (
        { formState, precomposedTransaction, selectedAccount, device, paymentRequests },
        { dispatch, getState, rejectWithValue },
    ) => {
        const network = getNetwork(selectedAccount.symbol);

        if (selectedAccount.networkType !== 'ethereum' || !network.chainId)
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Ethereum network mismatch.',
            });

        const addressDisplayType = selectAddressDisplayType(getState());

        const { nonce } = await dispatch(
            ethereumGetCurrentNonceThunk({
                selectedAccount,
                rbfParams: formState.rbfParams,
            }),
        ).unwrap();

        // transform to TrezorConnect.ethereumSignTransaction params
        const transaction = prepareEthereumTransaction({
            token: precomposedTransaction.token,
            chainId: network.chainId,
            to: formState.outputs[0].address,
            amount: formState.outputs[0].amount,
            data: formState.transactionData,
            gasLimit: precomposedTransaction.feeLimit || '',
            maxFeePerGas: precomposedTransaction.maxFeePerGas,
            maxPriorityFeePerGas: precomposedTransaction.maxPriorityFeePerGas,
            gasPrice: precomposedTransaction.feePerByte,
            nonce,
            payment_req: paymentRequests?.[0] ?? undefined,
        });

        const response = await TrezorConnect.ethereumSignTransaction({
            device: {
                path: device.path,
                instance: device.instance,
                state: device.state,
                useEmptyPassphrase: device.useEmptyPassphrase,
            },
            path: selectedAccount.path,
            transaction,
            chunkify: addressDisplayType === AddressDisplayOptions.CHUNKED,
        });

        if (!response.success) {
            // catch manual error from TransactionReviewModal
            return rejectWithValue({
                error: 'sign-transaction-failed',
                errorCode: response.error.code,
                message: response.error.message,
            });
        }

        return { serializedTx: response.payload.serializedTx };
    },
);
