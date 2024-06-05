import { G } from '@mobily/ts-belt';

import { BigNumber } from '@trezor/utils/src/bigNumber';
import TrezorConnect, { FeeLevel } from '@trezor/connect';
import type { TokenInfo, TokenAccount } from '@trezor/blockchain-link-types';
import { SYSTEM_PROGRAM_PUBLIC_KEY } from '@trezor/blockchain-link-utils/src/solana';
import {
    ExternalOutput,
    PrecomposedTransaction,
    PrecomposedLevels,
} from '@suite-common/wallet-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import { createThunk } from '@suite-common/redux-utils';
import {
    amountToSatoshi,
    calculateMax,
    calculateTotal,
    formatAmount,
    getExternalComposeOutput,
} from '@suite-common/wallet-utils';
import {
    getPubKeyFromAddress,
    buildTransferTransaction,
    buildTokenTransferTransaction,
    getAssociatedTokenAccountAddress,
    dummyPriorityFeesForFeeEstimation,
} from '@suite-common/wallet-utils';

import { selectBlockchainBlockInfoBySymbol } from '../blockchain/blockchainReducer';
import { selectDevice } from '../device/deviceReducer';
import { ComposeTransactionThunkArguments, SignTransactionThunkArguments } from './sendFormTypes';
import { SEND_MODULE_PREFIX } from './sendFormConstants';

const calculate = (
    availableBalance: string,
    output: ExternalOutput,
    feeLevel: FeeLevel,
    token?: TokenInfo,
): PrecomposedTransaction => {
    const feeInLamports = feeLevel.feePerTx;
    if (feeInLamports == null) throw new Error('Invalid fee.');

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
        feePerByte: feeLevel.feePerUnit,
        feeLimit: feeLevel.feeLimit,
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
    let tokenInfo: TokenAccount | undefined;

    const accountInfoResponse = await TrezorConnect.getAccountInfo({
        coin: symbol,
        descriptor: address,
        details: 'tokens',
    });

    if (accountInfoResponse.success) {
        const associatedTokenAccount = await getAssociatedTokenAccountAddress(address, mint);

        accountOwner = accountInfoResponse.payload?.misc?.owner;
        tokenInfo = accountInfoResponse.payload?.tokens
            ?.find(token => token.contract === mint)
            ?.accounts?.find(account => associatedTokenAccount.toString() === account.publicKey);
    }

    return [accountOwner, tokenInfo] as const;
};

export const composeSolanaSendFormTransactionThunk = createThunk(
    `${SEND_MODULE_PREFIX}/composeSolanaSendFormTransactionThunk`,
    async ({ formValues, formState }: ComposeTransactionThunkArguments, { getState }) => {
        const { account, network, feeInfo } = formState;
        const composeOutputs = getExternalComposeOutput(formValues, account, network);
        if (!composeOutputs) return; // no valid Output

        const { output, decimals, tokenInfo } = composeOutputs;

        const { blockhash, blockHeight: lastValidBlockHeight } = selectBlockchainBlockInfoBySymbol(
            getState(),
            account.symbol,
        );

        const [recipientAccountOwner, recipientTokenAccount] = tokenInfo
            ? await fetchAccountOwnerAndTokenInfoForAddress(
                  formValues.outputs[0].address,
                  account.symbol,
                  tokenInfo.contract,
              )
            : [undefined, undefined];

        // invalid token transfer -- should never happen
        if (tokenInfo && !tokenInfo.accounts) return;

        const tokenTransferTxAndDestinationAddress =
            tokenInfo && tokenInfo.accounts
                ? await buildTokenTransferTransaction(
                      account.descriptor,
                      formValues.outputs[0].address || account.descriptor,
                      recipientAccountOwner || SYSTEM_PROGRAM_PUBLIC_KEY,
                      tokenInfo.contract,
                      formValues.outputs[0].amount || '0',
                      tokenInfo.decimals,
                      tokenInfo.accounts,
                      recipientTokenAccount,
                      blockhash,
                      lastValidBlockHeight,
                      dummyPriorityFeesForFeeEstimation,
                  )
                : undefined;

        // To estimate fees on Solana we need to turn a transaction into a message for which fees are estimated.
        // Since all the values don't have to be filled in the form at the time of this function call, we use dummy values
        // for the estimation, since these values don't affect the final fee.
        // The real transaction is constructed in `signTransaction`, this one is used solely for fee estimation and is never submitted.
        const transactionMessage = (
            tokenTransferTxAndDestinationAddress != null
                ? tokenTransferTxAndDestinationAddress.transaction
                : await buildTransferTransaction(
                      account.descriptor,
                      formValues.outputs[0].address || account.descriptor,
                      formValues.outputs[0].amount || '0',
                      blockhash,
                      lastValidBlockHeight,
                      dummyPriorityFeesForFeeEstimation,
                  )
        ).compileMessage();

        const isCreatingAccount =
            tokenInfo &&
            recipientTokenAccount === undefined &&
            // if the recipient account has no owner, it means it's a new account and needs the token account to be created
            (recipientAccountOwner === SYSTEM_PROGRAM_PUBLIC_KEY || recipientAccountOwner == null);

        const estimatedFee = await TrezorConnect.blockchainEstimateFee({
            coin: account.symbol,
            request: {
                specific: {
                    data: transactionMessage.serialize().toString('hex'),
                    isCreatingAccount,
                },
            },
        });

        let fetchedFee: string | undefined;
        let fetchedFeePerUnit: string | undefined;
        let fetchedFeeLimit: string | undefined;
        if (estimatedFee.success) {
            // We access the array directly like this because the fee response from the solana worker always returns an array of size 1
            const feeLevel = estimatedFee.payload.levels[0];
            fetchedFee = feeLevel.feePerTx;
            fetchedFeePerUnit = feeLevel.feePerUnit;
            fetchedFeeLimit = feeLevel.feeLimit;
        } else {
            // Error fetching fee, fall back on default values defined in `/packages/connect/src/data/defaultFeeLevels.ts`
        }

        // FeeLevels are read-only, so we create a copy if need be
        const levels = fetchedFee ? feeInfo.levels.map(l => ({ ...l })) : feeInfo.levels;
        // update predefined levels with fee fetched from network
        const predefinedLevels = levels
            .filter(l => l.label !== 'custom')
            .map(l => ({
                ...l,
                feePerTx: fetchedFee || l.feePerTx,
                feePerUnit: fetchedFeePerUnit || l.feePerUnit,
                feeLimit: fetchedFeeLimit || l.feeLimit,
            }));

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
    },
);

export const signSolanaSendFormTransactionThunk = createThunk(
    `${SEND_MODULE_PREFIX}/signSolanaSendFormTransactionThunk`,
    async (
        { formValues, precomposedTransaction, selectedAccount }: SignTransactionThunkArguments,
        { dispatch, getState, extra },
    ) => {
        const {
            selectors: { selectSelectedAccountStatus },
        } = extra;

        const selectedAccountStatus = selectSelectedAccountStatus(getState());
        const device = selectDevice(getState());

        if (
            G.isNullable(selectedAccount) ||
            selectedAccountStatus !== 'loaded' ||
            !device ||
            !precomposedTransaction ||
            precomposedTransaction.type !== 'final' ||
            precomposedTransaction.feeLimit == null
        )
            return;

        if (selectedAccount.networkType !== 'solana') return;
        const { token } = precomposedTransaction;

        const { blockhash, blockHeight: lastValidBlockHeight } = selectBlockchainBlockInfoBySymbol(
            getState(),
            selectedAccount.symbol,
        );

        const [recipientAccountOwner, recipientTokenAccounts] = token
            ? await fetchAccountOwnerAndTokenInfoForAddress(
                  formValues.outputs[0].address,
                  selectedAccount.symbol,
                  token.contract,
              )
            : [undefined, undefined];

        if (token && !token.accounts) return;

        const tokenTransferTxAndDestinationAddress =
            token && token.accounts
                ? await buildTokenTransferTransaction(
                      selectedAccount.descriptor,
                      formValues.outputs[0].address || selectedAccount.descriptor,
                      recipientAccountOwner || SYSTEM_PROGRAM_PUBLIC_KEY,
                      token.contract,
                      formValues.outputs[0].amount || '0',
                      token.decimals,
                      token.accounts,
                      recipientTokenAccounts,
                      blockhash,
                      lastValidBlockHeight,
                      {
                          computeUnitPrice: precomposedTransaction.feePerByte,
                          computeUnitLimit: precomposedTransaction.feeLimit,
                      },
                  )
                : undefined;

        if (token && !tokenTransferTxAndDestinationAddress) return;

        const tx = tokenTransferTxAndDestinationAddress
            ? tokenTransferTxAndDestinationAddress.transaction
            : await buildTransferTransaction(
                  selectedAccount.descriptor,
                  formValues.outputs[0].address,
                  formValues.outputs[0].amount,
                  blockhash,
                  lastValidBlockHeight,
                  {
                      computeUnitPrice: precomposedTransaction.feePerByte,
                      computeUnitLimit: precomposedTransaction.feeLimit,
                  },
              );

        const serializedTx = tx.serializeMessage().toString('hex');

        const signature = await TrezorConnect.solanaSignTransaction({
            device: {
                path: device.path,
                instance: device.instance,
                state: device.state,
            },
            useEmptyPassphrase: device.useEmptyPassphrase,
            path: selectedAccount.path,
            serializedTx,
            additionalInfo:
                tokenTransferTxAndDestinationAddress &&
                tokenTransferTxAndDestinationAddress.tokenAccountInfo
                    ? {
                          tokenAccountsInfos: [
                              tokenTransferTxAndDestinationAddress.tokenAccountInfo,
                          ],
                      }
                    : undefined,
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

        const signerPubKey = await getPubKeyFromAddress(selectedAccount.descriptor);
        tx.addSignature(signerPubKey, Buffer.from(signature.payload.signature, 'hex'));

        const signedTx = tx.serialize().toString('hex');

        return signedTx;
    },
);
