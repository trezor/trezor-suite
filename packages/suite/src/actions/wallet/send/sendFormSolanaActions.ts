import TrezorConnect, { FeeLevel } from '@trezor/connect';
import type { TokenInfo, TokenAccount } from '@trezor/blockchain-link-types';
import {
    FormState,
    PrecomposedTransactionFinal,
    ComposeActionContext,
    ExternalOutput,
    PrecomposedTransaction,
    PrecomposedLevels,
} from '@suite-common/wallet-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import { selectBlockchainBlockHashBySymbol, selectDevice } from '@suite-common/wallet-core';
import { Dispatch, GetState } from 'src/types/suite';
import {
    amountToSatoshi,
    calculateMax,
    calculateTotal,
    formatAmount,
    getExternalComposeOutput,
} from '@suite-common/wallet-utils';
import BigNumber from 'bignumber.js';
import {
    getPubKeyFromAddress,
    buildTransferTransaction,
    buildTokenTransferTransaction,
} from 'src/utils/wallet/solanaUtils';
import { SYSTEM_PROGRAM_PUBLIC_KEY } from '@trezor/blockchain-link-utils/lib/solana';

const calculate = (
    availableBalance: string,
    output: ExternalOutput,
    feeLevel: FeeLevel,
    token?: TokenInfo,
): PrecomposedTransaction => {
    const feeInLamports = feeLevel.feePerUnit;
    let amount: string;
    let max: string | undefined;
    const availableTokenBalance = token
        ? amountToSatoshi(token.balance!, token.decimals)
        : undefined;
    if (output.type === 'send-max' || output.type === 'send-max-noaddress') {
        max = availableTokenBalance || calculateMax(availableBalance, feeInLamports);
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

    const payloadData: PrecomposedTransaction = {
        type: 'nonfinal',
        totalSpent: token ? amount : totalSpent.toString(),
        max,
        fee: feeInLamports,
        feePerByte: feeInLamports,
        token,
        bytes: 0,
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

const fetchAccountOwnerAndTokenInfoForAddress = async (
    address: string,
    symbol: string,
    mint: string,
) => {
    // Fetch data about recipient account owner if this is a token transfer
    // We need this in order to validate the address and ensure transfers go through
    let accountOwner: string | undefined;
    let tokenInfo: TokenAccount[] | undefined;

    const accountInfoResponse = await TrezorConnect.getAccountInfo({
        coin: symbol,
        descriptor: address,
    });

    if (accountInfoResponse.success) {
        accountOwner = accountInfoResponse.payload?.misc?.owner;
        tokenInfo = accountInfoResponse.payload?.tokens?.find(token => token.contract === mint)
            ?.accounts;
    }

    return [accountOwner, tokenInfo] as const;
};

export const composeTransaction =
    (formValues: FormState, formState: ComposeActionContext) =>
    async (_dispatch: Dispatch, getState: GetState) => {
        const { account, network, feeInfo } = formState;
        const composeOutputs = getExternalComposeOutput(formValues, account, network);
        if (!composeOutputs) return; // no valid Output

        const { output, decimals, tokenInfo } = composeOutputs;

        let fetchedFee: string | undefined;

        const blockhash = selectBlockchainBlockHashBySymbol(getState(), account.symbol);

        const [recipientAccountOwner, recipientTokenAccounts] = tokenInfo
            ? await fetchAccountOwnerAndTokenInfoForAddress(
                  formValues.outputs[0].address,
                  account.symbol,
                  tokenInfo.contract,
              )
            : [undefined, undefined];

        // invalid token transfer -- should never happen
        if (tokenInfo && !tokenInfo.accounts) return;

        // To estimate fees on Solana we need to turn a transaction into a message for which fees are estimated.
        // Since all the values don't have to be filled in the form at the time of this function call, we use dummy values
        // for the estimation, since these values don't affect the final fee.
        // The real transaction is constructed in `signTransaction`, this one is used solely for fee estimation and is never submitted.
        const transactionMessage = (
            tokenInfo && tokenInfo.accounts
                ? await buildTokenTransferTransaction(
                      account.descriptor,
                      formValues.outputs[0].address || account.descriptor,
                      recipientAccountOwner || SYSTEM_PROGRAM_PUBLIC_KEY,
                      tokenInfo.contract,
                      formValues.outputs[0].amount || '0',
                      tokenInfo.decimals,
                      tokenInfo.accounts,
                      recipientTokenAccounts,
                      blockhash,
                      50,
                  )
                : await buildTransferTransaction(
                      account.descriptor,
                      formValues.outputs[0].address || account.descriptor,
                      formValues.outputs[0].amount || '0',
                      blockhash,
                      50,
                  )
        ).compileMessage();

        const isCreatingAccount =
            tokenInfo &&
            recipientTokenAccounts === undefined &&
            recipientAccountOwner === SYSTEM_PROGRAM_PUBLIC_KEY;

        const estimatedFee = await TrezorConnect.blockchainEstimateFee({
            coin: account.symbol,
            request: {
                specific: {
                    data: transactionMessage.serialize().toString('hex'),
                    isCreatingAccount,
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
        // update predefined levels with fee fetched from network
        const predefinedLevels = levels
            .filter(l => l.label !== 'custom')
            .map(l => ({ ...l, feePerUnit: fetchedFee || l.feePerUnit }));

        const wrappedResponse: PrecomposedLevels = {};
        const response = predefinedLevels.map(level =>
            calculate(account.availableBalance, output, level, tokenInfo),
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
        const device = selectDevice(getState());

        if (
            selectedAccount.status !== 'loaded' ||
            !device ||
            !transactionInfo ||
            transactionInfo.type !== 'final'
        )
            return;

        const { account } = selectedAccount;

        if (account.networkType !== 'solana') return;
        const { token } = transactionInfo;

        const blockhash = selectBlockchainBlockHashBySymbol(getState(), account.symbol);

        const [recipientAccountOwner, recipientTokenAccounts] = token
            ? await fetchAccountOwnerAndTokenInfoForAddress(
                  formValues.outputs[0].address,
                  account.symbol,
                  token.contract,
              )
            : [undefined, undefined];

        if (token && !token.accounts && !recipientAccountOwner) return;

        // The last block height for which the transaction will be considered valid, after which it can no longer be processed.
        // The current block time is set to 800ms, meaning this transaction should be valid when submitted within for 40 seconds
        // For more information see: https://docs.solana.com/cluster/synchronization
        const lastValidBlockHeight = 50;

        const tx =
            token && token.accounts && recipientAccountOwner
                ? await buildTokenTransferTransaction(
                      account.descriptor,
                      formValues.outputs[0].address,
                      recipientAccountOwner,
                      token.contract,
                      formValues.outputs[0].amount,
                      token.decimals,
                      token.accounts,
                      recipientTokenAccounts,
                      blockhash,
                      lastValidBlockHeight,
                  )
                : await buildTransferTransaction(
                      account.descriptor,
                      formValues.outputs[0].address,
                      formValues.outputs[0].amount,
                      blockhash,
                      lastValidBlockHeight,
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

        const signerPubKey = await getPubKeyFromAddress(account.descriptor);
        tx.addSignature(signerPubKey, Buffer.from(signature.payload.signature, 'hex'));

        const signedTx = tx.serialize().toString('hex');

        return signedTx;
    };
