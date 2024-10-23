import { BigNumber } from '@trezor/utils/src/bigNumber';
import TrezorConnect, { FeeLevel } from '@trezor/connect';
import type { TokenInfo, TokenAccount } from '@trezor/blockchain-link-types';
import { SYSTEM_PROGRAM_PUBLIC_KEY } from '@trezor/blockchain-link-utils/src/solana';
import {
    ExternalOutput,
    PrecomposedTransaction,
    PrecomposedLevels,
    Account,
} from '@suite-common/wallet-types';
import { createThunk } from '@suite-common/redux-utils';
import {
    formatAmountWithDecimals,
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
import {
    ComposeTransactionThunkArguments,
    ComposeFeeLevelsError,
    SignTransactionThunkArguments,
    SignTransactionError,
} from './sendFormTypes';
import { SEND_MODULE_PREFIX } from './sendFormConstants';

const calculate = (
    availableBalance: string,
    output: ExternalOutput,
    feeLevel: FeeLevel,
    decimals: number,
    rent: number,
    token?: TokenInfo,
): PrecomposedTransaction => {
    const feeInLamports = feeLevel.feePerTx;
    if (feeInLamports == null) throw new Error('Invalid fee.');

    let amount: string;
    let max: string | undefined;
    const availableTokenBalance = token
        ? formatAmountWithDecimals(token.balance!, token.decimals)
        : undefined;
    if (output.type === 'send-max' || output.type === 'send-max-noaddress') {
        max = availableTokenBalance || calculateMax(availableBalance, feeInLamports);
        amount = max;
    } else {
        amount = output.amount;
    }

    // total SOL spent (amount + fee), in case of SPL token only the fee
    const totalSolSpent = new BigNumber(calculateTotal(token ? '0' : amount, feeInLamports));

    if (totalSolSpent.isGreaterThan(availableBalance)) {
        const error = token ? 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE' : 'AMOUNT_IS_NOT_ENOUGH';

        // errorMessage declared later
        return { type: 'error', error, errorMessage: { id: error } } as const;
    }
    const remainingSolBalance = new BigNumber(availableBalance).minus(totalSolSpent);

    if (remainingSolBalance.isLessThan(rent) && remainingSolBalance.isGreaterThan(0)) {
        const errorMessage = {
            id: 'REMAINING_BALANCE_LESS_THAN_RENT' as const,
            values: {
                remainingSolBalance: formatAmount(remainingSolBalance, decimals),
                rent: formatAmount(rent, decimals),
            },
        };

        return { type: 'error', error: errorMessage.id, errorMessage } as const;
    }

    const payloadData: PrecomposedTransaction = {
        type: 'nonfinal',
        totalSpent: token ? amount : totalSolSpent.toString(),
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

function assertIsSolanaAccount(
    account: Account,
): asserts account is Extract<Account, { networkType: 'solana' }> {
    if (account.networkType !== 'solana')
        throw new Error(`Invalid network type. ${account.networkType}`);
}

export const composeSolanaTransactionFeeLevelsThunk = createThunk<
    PrecomposedLevels,
    ComposeTransactionThunkArguments,
    { rejectValue: ComposeFeeLevelsError }
>(
    `${SEND_MODULE_PREFIX}/composeSolanaTransactionFeeLevelsThunk`,
    async ({ formState, composeContext }, { getState, rejectWithValue }) => {
        const { account, network, feeInfo } = composeContext;
        const composedOutput = getExternalComposeOutput(formState, account, network);
        if (!composedOutput)
            return rejectWithValue({
                error: 'fee-levels-compose-failed',
                message: 'Unable to prepare compose output.',
            });

        const { output, decimals, tokenInfo } = composedOutput;

        const { blockhash, blockHeight: lastValidBlockHeight } = selectBlockchainBlockInfoBySymbol(
            getState(),
            account.symbol,
        );

        const [recipientAccountOwner, recipientTokenAccount] = tokenInfo
            ? await fetchAccountOwnerAndTokenInfoForAddress(
                  formState.outputs[0].address,
                  account.symbol,
                  tokenInfo.contract,
              )
            : [undefined, undefined];

        // invalid token transfer -- should never happen
        if (tokenInfo && !tokenInfo.accounts)
            return rejectWithValue({
                error: 'fee-levels-compose-failed',
                message: 'Token accounts not found.',
            });

        const tokenTransferTxAndDestinationAddress =
            tokenInfo && tokenInfo.accounts
                ? await buildTokenTransferTransaction(
                      account.descriptor,
                      formState.outputs[0].address || account.descriptor,
                      recipientAccountOwner || SYSTEM_PROGRAM_PUBLIC_KEY,
                      tokenInfo.contract,
                      formState.outputs[0].amount || '0',
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
                      formState.outputs[0].address || account.descriptor,
                      formState.outputs[0].amount || '0',
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

        const resultLevels: PrecomposedLevels = {};

        assertIsSolanaAccount(account);

        const response = predefinedLevels.map(level =>
            calculate(
                account.availableBalance,
                output,
                level,
                decimals,
                account.misc.rent ?? 0,
                tokenInfo,
            ),
        );
        response.forEach((tx, index) => {
            const feeLabel = predefinedLevels[index].label as FeeLevel['label'];
            resultLevels[feeLabel] = tx;
        });

        // format max (calculate sends it as lamports)
        // update errorMessage values (symbol)
        Object.keys(resultLevels).forEach(key => {
            const tx = resultLevels[key];
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

        return resultLevels;
    },
);

export const signSolanaSendFormTransactionThunk = createThunk<
    { serializedTx: string },
    SignTransactionThunkArguments,
    { rejectValue: SignTransactionError }
>(
    `${SEND_MODULE_PREFIX}/signSolanaSendFormTransactionThunk`,
    async (
        { formState, precomposedTransaction, selectedAccount, device },
        { getState, rejectWithValue },
    ) => {
        if (precomposedTransaction.feeLimit == null)
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Fee limit missing.',
            });

        if (selectedAccount.networkType !== 'solana')
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Invalid network type.',
            });
        const { token } = precomposedTransaction;

        const { blockhash, blockHeight: lastValidBlockHeight } = selectBlockchainBlockInfoBySymbol(
            getState(),
            selectedAccount.symbol,
        );

        const [recipientAccountOwner, recipientTokenAccounts] = token
            ? await fetchAccountOwnerAndTokenInfoForAddress(
                  formState.outputs[0].address,
                  selectedAccount.symbol,
                  token.contract,
              )
            : [undefined, undefined];

        if (token && !token.accounts)
            rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Missing token accounts.',
            });

        const tokenTransferTxAndDestinationAddress =
            token && token.accounts
                ? await buildTokenTransferTransaction(
                      selectedAccount.descriptor,
                      formState.outputs[0].address || selectedAccount.descriptor,
                      recipientAccountOwner || SYSTEM_PROGRAM_PUBLIC_KEY,
                      token.contract,
                      formState.outputs[0].amount || '0',
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

        if (token && !tokenTransferTxAndDestinationAddress)
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Token transfer address missing.',
            });

        const tx = tokenTransferTxAndDestinationAddress
            ? tokenTransferTxAndDestinationAddress.transaction
            : await buildTransferTransaction(
                  selectedAccount.descriptor,
                  formState.outputs[0].address,
                  formState.outputs[0].amount,
                  blockhash,
                  lastValidBlockHeight,
                  {
                      computeUnitPrice: precomposedTransaction.feePerByte,
                      computeUnitLimit: precomposedTransaction.feeLimit,
                  },
              );

        const serializedTx = tx.serializeMessage().toString('hex');

        const response = await TrezorConnect.solanaSignTransaction({
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

        if (!response.success) {
            // catch manual error from TransactionReviewModal
            return rejectWithValue({
                error: 'sign-transaction-failed',
                errorCode: response.payload.code,
                message: response.payload.error,
            });
        }

        const signerPubKey = await getPubKeyFromAddress(selectedAccount.descriptor);
        tx.addSignature(signerPubKey, Buffer.from(response.payload.signature, 'hex'));

        const signedSerializedTx = tx.serialize().toString('hex');

        return { serializedTx: signedSerializedTx };
    },
);
