import { toWei } from 'web3-utils';

import { BigNumber } from '@trezor/utils/src/bigNumber';
import TrezorConnect, { FeeLevel, TokenInfo } from '@trezor/connect';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    calculateTotal,
    calculateMax,
    calculateEthFee,
    getEthereumEstimateFeeParams,
    prepareEthereumTransaction,
    getExternalComposeOutput,
    amountToSatoshi,
    formatAmount,
    isPending,
    getAccountIdentity,
} from '@suite-common/wallet-utils';
import { createThunk } from '@suite-common/redux-utils';
import { ERC20_BACKUP_GAS_LIMIT, ETH_BACKUP_GAS_LIMIT } from '@suite-common/wallet-constants';
import {
    PrecomposedLevels,
    PrecomposedTransaction,
    ExternalOutput,
} from '@suite-common/wallet-types';
import { AddressDisplayOptions } from '@suite-common/wallet-types';
import { getNetwork } from '@suite-common/wallet-config';
import { getTxStakeNameByDataHex } from '@suite-common/suite-utils';

import { selectTransactions } from '../transactions/transactionsReducer';
import {
    ComposeTransactionThunkArguments,
    ComposeFeeLevelsError,
    SignTransactionThunkArguments,
    SignTransactionError,
} from './sendFormTypes';
import { SEND_MODULE_PREFIX } from './sendFormConstants';
import { STAKE_GAS_LIMIT_RESERVE } from '../stake/stakeTypes';

const calculate = (
    availableBalance: string,
    output: ExternalOutput,
    feeLevel: FeeLevel,
    token?: TokenInfo,
): PrecomposedTransaction => {
    const feeInSatoshi = calculateEthFee(
        toWei(feeLevel.feePerUnit, 'gwei'),
        feeLevel.feeLimit || '0',
    );

    let amount: string;
    let max: string | undefined;
    const availableTokenBalance = token
        ? amountToSatoshi(token.balance!, token.decimals)
        : undefined;
    if (output.type === 'send-max' || output.type === 'send-max-noaddress') {
        max = availableTokenBalance || calculateMax(availableBalance, feeInSatoshi);
        amount = max;
    } else {
        amount = output.amount;
    }

    // total ETH spent (amount + fee), in ERC20 only fee
    const totalSpent = new BigNumber(calculateTotal(token ? '0' : amount, feeInSatoshi));

    if (totalSpent.isGreaterThan(availableBalance)) {
        const error = token ? 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE' : 'AMOUNT_IS_NOT_ENOUGH';

        // errorMessage declared later
        return { type: 'error', error, errorMessage: { id: error } } as const;
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
        fee: feeInSatoshi,
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
    async ({ formState, composeContext }, { dispatch, rejectWithValue }) => {
        const { account, network, feeInfo } = composeContext;
        const composedOutput = getExternalComposeOutput(formState, account, network);
        if (!composedOutput)
            return rejectWithValue({
                error: 'fee-levels-compose-failed',
                message: 'Unable to compose output.',
            });

        const { output, tokenInfo, decimals } = composedOutput;
        const { availableBalance } = account;
        const { address, amount } = formState.outputs[0];

        // gasLimit calculation based on address, amount and data size
        // amount in essential for a proper calculation of gasLimit (via blockbook/geth)
        const estimatedFee = await TrezorConnect.blockchainEstimateFee({
            coin: account.symbol,
            identity: getAccountIdentity(account),
            request: {
                blocks: [2],
                specific: {
                    from: account.descriptor,
                    ...getEthereumEstimateFeeParams(
                        address || account.descriptor,
                        // if amount is not set (set-max case) use max available balance
                        amount || (tokenInfo ? tokenInfo.balance! : account.formattedBalance),
                        tokenInfo,
                        formState.ethereumDataHex,
                    ),
                },
            },
        });

        let customFeeLimit: BigNumber;
        if (estimatedFee.success) {
            customFeeLimit = new BigNumber(estimatedFee.payload.levels[0].feeLimit || '');
        } else {
            customFeeLimit = new BigNumber(
                tokenInfo ? ERC20_BACKUP_GAS_LIMIT : ETH_BACKUP_GAS_LIMIT,
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
        const isStakeEthTx = !!getTxStakeNameByDataHex(formState.ethereumDataHex);
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
            predefinedLevels.push({
                label: 'custom',
                feePerUnit: formState.feePerUnit,
                feeLimit: formState.feeLimit,
                blocks: -1,
            });
        }

        // wrap response into PrecomposedLevels object where key is a FeeLevel label
        const resultLevels: PrecomposedLevels = {};
        const response = predefinedLevels.map(level =>
            calculate(availableBalance, output, level, tokenInfo),
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
                tx.max = tx.max ? formatAmount(tx.max, decimals) : undefined;
                tx.estimatedFeeLimit = !customFeeLimit.isNaN()
                    ? customFeeLimit.toFixed(0)
                    : undefined;
            }
            if (tx.type === 'error' && tx.error === 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE') {
                tx.errorMessage = {
                    id: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE',
                    values: { symbol: network.symbol.toUpperCase() },
                };
            }
        });

        return resultLevels;
    },
);

export const signEthereumSendFormTransactionThunk = createThunk<
    { serializedTx: string },
    SignTransactionThunkArguments,
    { rejectValue: SignTransactionError }
>(
    `${SEND_MODULE_PREFIX}/signEthereumSendFormTransactionThunk`,
    async (
        { formState, precomposedTransaction, selectedAccount, device },
        { getState, extra, rejectWithValue },
    ) => {
        const {
            selectors: { selectAddressDisplayType },
        } = extra;
        const transactions = selectTransactions(getState());

        const network = getNetwork(selectedAccount.symbol);

        if (selectedAccount.networkType !== 'ethereum' || !network.chainId)
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Ethereum network mismatch.',
            });

        const addressDisplayType = selectAddressDisplayType(getState());

        // Ethereum account `misc.nonce` is not updated before pending tx is mined
        // Calculate `pendingNonce`: greatest value in pending tx + 1
        // This may lead to unexpected/unwanted behavior
        // whenever pending tx gets rejected all following txs (with higher nonce) will be rejected as well
        const pendingTxs = (transactions[selectedAccount.key] || []).filter(isPending);
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

        if (formState.rbfParams && typeof formState.rbfParams.ethereumNonce === 'number') {
            nonce = formState.rbfParams.ethereumNonce.toString();
        }

        // transform to TrezorConnect.ethereumSignTransaction params
        const transaction = prepareEthereumTransaction({
            token: precomposedTransaction.token,
            chainId: network.chainId,
            to: formState.outputs[0].address,
            amount: formState.outputs[0].amount,
            data: formState.ethereumDataHex,
            gasLimit: precomposedTransaction.feeLimit || '',
            gasPrice: precomposedTransaction.feePerByte,
            nonce,
        });

        const response = await TrezorConnect.ethereumSignTransaction({
            device: {
                path: device.path,
                instance: device.instance,
                state: device.state,
            },
            useEmptyPassphrase: device.useEmptyPassphrase,
            path: selectedAccount.path,
            transaction,
            chunkify: addressDisplayType === AddressDisplayOptions.CHUNKED,
        });

        if (!response.success) {
            // catch manual error from TransactionReviewModal
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: response.payload.error,
            });
        }

        return { serializedTx: response.payload.serializedTx };
    },
);
