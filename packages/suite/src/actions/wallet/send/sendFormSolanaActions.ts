import TrezorConnect, { FeeLevel, TokenInfo } from '@trezor/connect';
import { Transaction, SystemProgram, PublicKey } from '@solana/web3.js';
import {
    FormState,
    PrecomposedTransactionFinal,
    ComposeActionContext,
    ExternalOutput,
    PrecomposedTransaction,
    PrecomposedLevels,
} from '@suite-common/wallet-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import { Dispatch, GetState } from 'src/types/suite';
import {
    calculateMax,
    calculateTotal,
    formatAmount,
    getExternalComposeOutput,
    getLamportsFromSol,
} from '@suite-common/wallet-utils';
import BigNumber from 'bignumber.js';

const calculate = (
    availableBalance: string,
    output: ExternalOutput,
    feeLevel: FeeLevel,
    token?: TokenInfo,
): PrecomposedTransaction => {
    const feeInLamports = feeLevel.feePerUnit;
    let amount: string;
    let max: string | undefined;
    if (output.type === 'send-max' || output.type === 'send-max-noaddress') {
        max = calculateMax(availableBalance, feeInLamports);
        amount = max;
    } else {
        amount = output.amount;
    }

    // total SOL spent (amount + fee), in case of SPL token only the fee
    const totalSpent = new BigNumber(calculateTotal(token ? '0' : amount, feeInLamports));

    if (totalSpent.isGreaterThan(availableBalance)) {
        const error = token ? 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE' : 'AMOUNT_IS_NOT_ENOUGH';
        // errorMessage declared later
        return { type: 'error', error, errorMessage: { id: error } } as const;
    }

    const payloadData = {
        type: 'nonfinal',
        totalSpent: token ? amount : totalSpent.toString(),
        max,
        fee: feeInLamports,
        feePerByte: feeInLamports,
        token,
        bytes: 0,
    } as const;

    if (output.type === 'send-max' || output.type === 'external') {
        return {
            ...payloadData,
            type: 'final',
            // compatibility with BTC PrecomposedTransaction from @trezor/connect
            transaction: {
                inputs: [],
                outputsPermutation: [0],
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

export const composeTransaction =
    (formValues: FormState, formState: ComposeActionContext) =>
    async (_dispatch: Dispatch, getState: GetState) => {
        const { account, network, feeInfo } = formState;
        const composeOutputs = getExternalComposeOutput(formValues, account, network);
        if (!composeOutputs) return; // no valid Output

        const { output, decimals } = composeOutputs;

        let fetchedFee: string | undefined;

        const blockhash = getState().wallet.blockchain.sol.blockHash;

        // To estimate fees on Solana we need to turn a transaction into a message for which fees are estimated.
        // Since all the values don't have to be filled in the form at the time of this function call, we use dummy values
        // for the estimation, since these values don't affect the final fee.
        // The real transaction is constructed in `signTransaction`, this one is used solely for fee estimation and is never submitted.
        const transactionMessage = new Transaction({
            blockhash,
            lastValidBlockHeight: 50,
            feePayer: new PublicKey(account.descriptor),
        })
            .add(
                SystemProgram.transfer({
                    fromPubkey: new PublicKey(account.descriptor),
                    // If the address field is not filled in, we use the account's own address as a placeholder value
                    toPubkey: new PublicKey(formValues.outputs[0].address || account.descriptor),
                    lamports: getLamportsFromSol(formValues.outputs[0].amount || '0'),
                }),
            )
            .compileMessage();

        const estimatedFee = await TrezorConnect.blockchainEstimateFee({
            coin: account.symbol,
            request: {
                specific: {
                    data: transactionMessage.serialize().toString('hex'),
                },
            },
        });

        if (estimatedFee.success) {
            // We access the array directly like this because the fee response from the solana worker always returns an array of size 1
            fetchedFee = estimatedFee.payload.levels[0].feePerUnit;
        } else {
            // Error fetching fee, fall back on default values defined in `/packages/connect/src/data/defaultFeeLevels.ts`
        }

        // FeeLevels are read-only, so we create a copy if need be
        const levels = fetchedFee ? feeInfo.levels.map(l => ({ ...l })) : feeInfo.levels;
        const predefinedLevels = levels.filter(l => l.label !== 'custom');

        // update predefined levels with fee fetched from network
        if (fetchedFee) {
            predefinedLevels.map(l => ({
                ...l,
                feePerUnit: fetchedFee,
            }));
        }

        const wrappedResponse: PrecomposedLevels = {};
        const response = predefinedLevels.map(level =>
            calculate(account.availableBalance, output, level),
        );
        response.forEach((tx, index) => {
            const feeLabel = predefinedLevels[index].label as FeeLevel['label'];
            wrappedResponse[feeLabel] = tx;
        });

        // format max (calculate sends it as lamports)
        // update errorMessage values (symbol)
        Object.keys(wrappedResponse).forEach(key => {
            const tx = wrappedResponse[key];
            if (tx.type !== 'error') {
                tx.max = tx.max ? formatAmount(tx.max, decimals) : undefined;
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
    (formValues: FormState, transactionInfo: PrecomposedTransactionFinal) =>
    async (dispatch: Dispatch, getState: GetState) => {
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
        if (account.networkType !== 'solana' || !network.chainId) return;

        const blockhash = getState().wallet.blockchain.sol.blockHash;

        // The last block height for which the transaction will be considered valid, after which it can no longer be processed.
        // The current block time is set to 800ms, meaning this transaction should be valid when submitted within for 40 seconds
        // For more information see: https://docs.solana.com/cluster/synchronization
        const lastValidBlockHeight = 50;

        const tx = new Transaction({
            blockhash,
            lastValidBlockHeight,
            feePayer: new PublicKey(account.descriptor),
        }).add(
            SystemProgram.transfer({
                fromPubkey: new PublicKey(account.descriptor),
                toPubkey: new PublicKey(formValues.outputs[0].address),
                lamports: getLamportsFromSol(formValues.outputs[0].amount),
            }),
        );
        const serializedTx = tx.serializeMessage().toString('hex');

        const signature = await TrezorConnect.solanaSignTransaction({
            device: {
                path: device.path,
                instance: device.instance,
                state: device.state,
            },
            path: account.path,
            serializedTx,
        });

        if (!signature.success) {
            // catch manual error from ReviewTransaction modal
            if (signature.payload.error === 'tx-cancelled') return;
            dispatch(
                notificationsActions.addToast({
                    type: 'sign-tx-error',
                    error: signature.payload.error,
                }),
            );
            return;
        }

        tx.addSignature(
            new PublicKey(account.descriptor),
            Buffer.from(signature.payload.signature, 'hex'),
        );
        const signedTx = tx.serialize().toString('hex');

        return signedTx;
    };
