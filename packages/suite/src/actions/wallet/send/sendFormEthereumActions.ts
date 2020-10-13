import TrezorConnect, { FeeLevel, TokenInfo } from 'trezor-connect';
import BigNumber from 'bignumber.js';
import { toWei } from 'web3-utils';
import * as notificationActions from '@suite-actions/notificationActions';
import {
    calculateTotal,
    calculateMax,
    calculateEthFee,
    serializeEthereumTx,
    prepareEthereumTransaction,
    getExternalComposeOutput,
} from '@wallet-utils/sendFormUtils';
import { amountToSatoshi, formatAmount } from '@wallet-utils/accountUtils';
import { ETH_DEFAULT_GAS_LIMIT, ERC20_GAS_LIMIT } from '@wallet-constants/sendForm';
import {
    FormState,
    UseSendFormState,
    PrecomposedLevels,
    PrecomposedTransaction,
    PrecomposedTransactionFinal,
    ExternalOutput,
} from '@wallet-types/sendForm';
import { Dispatch, GetState } from '@suite-types';

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
                        // eslint-disable-next-line @typescript-eslint/camelcase
                        script_type: 'PAYTOADDRESS',
                    },
                ],
            },
        };
    }
    return payloadData;
};

export const composeTransaction = (
    formValues: FormState,
    formState: UseSendFormState,
) => async () => {
    const { account, network, feeInfo } = formState;
    const composeOutputs = getExternalComposeOutput(formValues, account, network);
    if (!composeOutputs) return; // no valid Output

    const { output, tokenInfo, decimals } = composeOutputs;
    const { availableBalance } = account;
    const { address } = formValues.outputs[0];

    // additional calculation for gasLimit based on data size
    let customFeeLimit: string | undefined;
    if (typeof formValues.ethereumDataHex === 'string' && formValues.ethereumDataHex.length > 0) {
        const response = await TrezorConnect.blockchainEstimateFee({
            coin: account.symbol,
            request: {
                blocks: [2],
                specific: {
                    from: account.descriptor,
                    to: address || account.descriptor,
                    data: formValues.ethereumDataHex,
                },
            },
        });

        if (response.success) {
            customFeeLimit = response.payload.levels[0].feeLimit;
        }
    }

    // set gasLimit based on ERC20 transfer
    if (tokenInfo) {
        customFeeLimit = ERC20_GAS_LIMIT;
    }

    const predefinedLevels = feeInfo.levels.filter(l => l.label !== 'custom');
    // in case when selectedFee is set to 'custom' construct this FeeLevel from values
    if (formValues.selectedFee === 'custom') {
        predefinedLevels.push({
            label: 'custom',
            feePerUnit: formValues.feePerUnit,
            feeLimit: formValues.feeLimit,
            blocks: -1,
        });
    }

    // update predefined levels with customFeeLimit (gasLimit from data size ot erc20 transfer)
    if (customFeeLimit) {
        predefinedLevels.forEach(l => (l.feeLimit = customFeeLimit));
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
        if (tx.type !== 'error' && tx.max) {
            tx.max = formatAmount(tx.max, decimals);
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

export const signTransaction = (
    formValues: FormState,
    transactionInfo: PrecomposedTransactionFinal,
) => async (dispatch: Dispatch, getState: GetState) => {
    const { selectedAccount } = getState().wallet;
    const { device } = getState().suite;
    if (
        selectedAccount.status !== 'loaded' ||
        !device ||
        !transactionInfo ||
        transactionInfo.type !== 'final'
    )
        return;

    const { account, network } = selectedAccount;
    if (account.networkType !== 'ethereum' || !network.chainId) return;

    // Ethereum account `misc.nonce` is not updated before pending tx is mined
    // Calculate `pendingNonce`: greatest value in pending tx + 1
    // This may lead to unexpected/unwanted behavior
    // whenever pending tx gets rejected all following txs (with higher nonce) will be rejected as well
    const pendingTxs = (getState().wallet.transactions.transactions[account.key] || []).filter(
        tx => !tx.blockHeight || tx.blockHeight <= 0,
    );
    const pendingNonce = pendingTxs.reduce((value, tx) => {
        if (!tx.ethereumSpecific) return value;
        return Math.max(value, tx.ethereumSpecific.nonce + 1);
    }, 0);
    const pendingNonceBig = new BigNumber(pendingNonce);
    const nonce =
        pendingNonceBig.gt(0) && pendingNonceBig.gt(account.misc.nonce)
            ? pendingNonceBig.toString()
            : account.misc.nonce;

    // transform to TrezorConnect.ethereumSignTransaction params
    const transaction = prepareEthereumTransaction({
        token: transactionInfo.token,
        chainId: network.chainId,
        to: formValues.outputs[0].address,
        amount: formValues.outputs[0].amount,
        data: formValues.ethereumDataHex,
        gasLimit: transactionInfo.feeLimit || ETH_DEFAULT_GAS_LIMIT,
        gasPrice: transactionInfo.feePerByte,
        nonce,
    });

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

    return serializeEthereumTx({
        ...transaction,
        ...signedTx.payload,
    });
};
