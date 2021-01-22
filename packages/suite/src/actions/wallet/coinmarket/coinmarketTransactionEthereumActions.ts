import TrezorConnect, { FeeLevel, TokenInfo } from 'trezor-connect';
import BigNumber from 'bignumber.js';
import { toWei } from 'web3-utils';
import { getExternalComposeOutput } from '@wallet-utils/exchangeFormUtils';
import {
    ComposeTransactionData,
    ReviewTransactionData,
    SignTransactionData,
} from '@wallet-types/transaction';
import * as notificationActions from '@suite-actions/notificationActions';
import {
    calculateTotal,
    calculateMax,
    calculateEthFee,
    serializeEthereumTx,
    getEthereumEstimateFeeParams,
    prepareEthereumTransaction,
} from '@wallet-utils/sendFormUtils';
import { isPending } from '@wallet-utils/transactionUtils';
import { amountToSatoshi, formatAmount } from '@wallet-utils/accountUtils';
import { ETH_DEFAULT_GAS_LIMIT, ERC20_GAS_LIMIT } from '@wallet-constants/sendForm';
import { PrecomposedLevels, PrecomposedTransaction, ExternalOutput } from '@wallet-types/sendForm';
import { Dispatch, GetState } from '@suite-types';
import { outputsWithFinalAddress } from './coinmarketTransactionBitcoinActions';
import * as coinmarketCommonActions from '@wallet-actions/coinmarket/coinmarketCommonActions';

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
        type: 'nonfinal',
        totalSpent: token ? amount : totalSpent.toString(),
        max,
        fee: feeInSatoshi,
        feePerByte: feeLevel.feePerUnit,
        feeLimit: feeLevel.feeLimit,
        token,
        bytes: 0, // TODO: calculate
    } as const;

    if (output.type === 'send-max' || output.type === 'external') {
        return {
            ...payloadData,
            type: 'final',
            // compatibility with BTC PrecomposedTransaction from trezor-connect
            transaction: {
                inputs: [],
                outputs: [
                    {
                        address: output.address,
                        amount,
                        script_type: 'PAYTOADDRESS',
                    },
                ],
            },
        };
    }

    return payloadData;
};

export const composeTransaction = (composeTransactionData: ComposeTransactionData) => async () => {
    const { account, network, feeInfo, address, amount, ethereumDataHex } = composeTransactionData;
    const composeOutputs = getExternalComposeOutput(composeTransactionData);
    if (!composeOutputs) return; // no valid Output

    const { output, tokenInfo, decimals } = composeOutputs;
    const { availableBalance } = account;
    let customFeeLimit: string | undefined;
    // set gasLimit based on ERC20 transfer
    if (tokenInfo) {
        customFeeLimit = ERC20_GAS_LIMIT;
    }

    // gasLimit calculation based on address, amount and data size
    // amount in essential for a proper calculation of gasLimit (via blockbook/geth)
    const estimatedFee = await TrezorConnect.blockchainEstimateFee({
        coin: account.symbol,
        request: {
            blocks: [2],
            specific: {
                from: account.descriptor,
                ...getEthereumEstimateFeeParams(
                    address || account.descriptor,
                    tokenInfo,
                    amount,
                    ethereumDataHex,
                ),
            },
        },
    });

    if (estimatedFee.success) {
        customFeeLimit = estimatedFee.payload.levels[0].feeLimit;
    } else {
        // TODO: catch error from blockbook/geth (invalid contract, not enough balance...)
    }

    // FeeLevels are read-only
    const levels = customFeeLimit ? feeInfo.levels.map(l => ({ ...l })) : feeInfo.levels;
    const predefinedLevels = levels.filter(l => l.label !== 'custom');
    // update predefined levels with customFeeLimit (gasLimit from data size or erc20 transfer)
    if (customFeeLimit) {
        predefinedLevels.forEach(l => (l.feeLimit = customFeeLimit));
    }
    // in case when selectedFee is set to 'custom' construct this FeeLevel from values
    if (composeTransactionData.selectedFee === 'custom') {
        predefinedLevels.push({
            label: 'custom',
            feePerUnit: composeTransactionData.feePerUnit,
            feeLimit: composeTransactionData.feeLimit,
            blocks: -1,
        });
    }

    // wrap response into PrecomposedLevels object where key is a FeeLevel label
    const wrappedResponse: PrecomposedLevels = {};
    const response = predefinedLevels.map(level =>
        calculate(availableBalance, output, level, tokenInfo),
    );
    response.forEach((tx, index) => {
        const feeLabel = predefinedLevels[index].label as FeeLevel['label'];
        wrappedResponse[feeLabel] = tx;
    });

    const hasAtLeastOneValid = response.find(r => r.type !== 'error');
    // there is no valid tx in predefinedLevels and there is no custom level
    if (!hasAtLeastOneValid && !wrappedResponse.custom) {
        const { minFee } = feeInfo;
        const lastKnownFee = predefinedLevels[predefinedLevels.length - 1].feePerUnit;
        let maxFee = new BigNumber(lastKnownFee).minus(1);
        // generate custom levels in range from lastKnownFee - 1 to feeInfo.minFee (coinInfo in trezor-connect)
        const customLevels: FeeLevel[] = [];
        while (maxFee.gte(minFee)) {
            customLevels.push({
                feePerUnit: maxFee.toString(),
                feeLimit: predefinedLevels[0].feeLimit,
                label: 'custom',
                blocks: -1,
            });
            maxFee = maxFee.minus(1);
        }

        // check if any custom level is possible
        const customLevelsResponse = customLevels.map(level =>
            calculate(availableBalance, output, level, tokenInfo),
        );

        const customValid = customLevelsResponse.findIndex(r => r.type !== 'error');
        if (customValid >= 0) {
            wrappedResponse.custom = customLevelsResponse[customValid];
        }
    }

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

export const signTransaction = (data: SignTransactionData) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { selectedAccount, transactions } = getState().wallet;
    const { device } = getState().suite;
    if (selectedAccount.status !== 'loaded' || !device || !data.transactionInfo) return;

    const { account } = selectedAccount;
    if (account.networkType !== 'ethereum' || !data.network.chainId) return;

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
    const nonce =
        pendingNonceBig.gt(0) && pendingNonceBig.gt(account.misc.nonce)
            ? pendingNonceBig.toString()
            : account.misc.nonce;

    const updatedOutputs = outputsWithFinalAddress(
        data.address,
        data.transactionInfo.transaction.outputs,
    );
    if (!updatedOutputs) {
        dispatch(
            notificationActions.addToast({
                type: 'sign-tx-error',
                error: 'Invalid transaction outputs',
            }),
        );
        return;
    }

    const decimals = data.transactionInfo.token
        ? data.transactionInfo.token.decimals
        : data.network.decimals;
    const transaction = prepareEthereumTransaction({
        token: data.transactionInfo.token,
        chainId: data.network.chainId,
        to: data.address,
        amount: formatAmount(data.transactionInfo.transaction.outputs[0].amount, decimals),
        gasLimit: data.transactionInfo.feeLimit || ETH_DEFAULT_GAS_LIMIT,
        gasPrice: data.transactionInfo.feePerByte,
        nonce,
    });

    const reviewData: ReviewTransactionData = {
        signedTx: undefined,
        transactionInfo: {
            ...data.transactionInfo,
            transaction: { ...data.transactionInfo.transaction, outputs: updatedOutputs },
        },
    };
    await dispatch(coinmarketCommonActions.saveTransactionReview(reviewData));

    const signedTx = await TrezorConnect.ethereumSignTransaction({
        device: {
            path: device.path,
            instance: device.instance,
            state: device.state,
        },
        useEmptyPassphrase: device.useEmptyPassphrase,
        path: account.path,
        transaction,
    });

    if (!signedTx.success) {
        // catch manual error from ReviewTransaction modal
        if (signedTx.payload.error === 'tx-cancelled') return;
        dispatch(
            notificationActions.addToast({
                type: 'sign-tx-error',
                error: signedTx.payload.error,
            }),
        );
        return;
    }

    return {
        ...reviewData,
        signedTx: {
            tx: serializeEthereumTx({
                ...transaction,
                ...signedTx.payload,
            }),
            coin: account.symbol,
        },
    };
};
