import { createThunk } from '@suite-common/redux-utils';
import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import {
    type Account,
    type AccountKey,
    type PrecomposedLevels,
    type PrecomposedTransactionFinal,
    type StakeFormState,
    type StakeType,
} from '@suite-common/wallet-types';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';
import { asCoinSymbol } from '@trezor/connect-common';
import { getSuiteVersion } from '@trezor/env-utils';
import type { SolanaNetworkSymbol } from '@trezor/network-solana/constants';
import solana from '@trezor/network-solana/runtime';
import type { Fee, PrepareStakeSolTxResponse } from '@trezor/network-solana/types';
import { BigNumber } from '@trezor/utils';

import { type AccountsRootState } from '../../accounts/accountsReducer';
import { selectAccountByKey } from '../../accounts/accountsSelectors';
import {
    type BlockchainRootState,
    selectNetworkBlockchainInfo,
} from '../../blockchain/blockchainReducer';
import { selectConvertedNetworkFeeInfo } from '../../fees/feesReducer';
import { type FeesRootState } from '../../fees/feesSelectors';
import { type SignTransactionError } from '../../send/sendFormTypes';
import { STAKE_MODULE_PREFIX } from '../stakingActions';
import {
    composeSolanaStakingTransaction,
    prepareSolanaStakeTxData,
} from './solanaStakingFormUtils';
import { isSupportedSolStakingNetworkSymbol } from './solanaStakingUtils';

export type SolanaStakingAccount = Account & {
    networkType: 'solana';
    symbol: SolanaNetworkSymbol;
};

const isSolanaStakingAccount = (account: Account): account is SolanaStakingAccount =>
    account.networkType === 'solana';

export type SolanaStakingComposeRejectValue = { error: string; message?: string };

export const getSolanaStakingUserAgent = () => `Trezor Suite ${getSuiteVersion()}`;

// Builds the StakeFormState the shared compose/sign helpers expect. For Solana the output
// "address" is the user's own descriptor (the validator/stake-account is selected internally
// by `prepareStakeSolTx`) and there is no calldata, so `transactionData` stays empty.
export const buildSolanaStakeFormState = (
    account: SolanaStakingAccount,
    amount: string,
    stakeType: StakeType,
): StakeFormState => ({
    outputs: [
        {
            address: account.descriptor,
            amount,
            type: 'payment',
            token: null,
            fiat: '',
            currency: { label: '', value: '' },
        },
    ],
    options: [],
    isCoinControlEnabled: false,
    hasCoinControlBeenOpened: false,
    selectedUtxos: [],
    selectedFee: 'normal',
    feePerUnit: '',
    feeLimit: '',
    stakeType,
});

const resolveSolanaBlockchainUrl = async (
    state: BlockchainRootState,
    symbol: NetworkSymbol,
): Promise<string | undefined> => {
    const connectedUrl = selectNetworkBlockchainInfo(state, symbol)?.url;
    if (connectedUrl) return connectedUrl;

    const info = await TrezorConnect.blockchainGetInfo({ coin: asCoinSymbol(symbol) });

    return info.success ? info.payload.url : undefined;
};

export type ResolveSolanaStakingContextState = AccountsRootState & BlockchainRootState;

export const resolveSolanaStakingContext = async (
    state: ResolveSolanaStakingContextState,
    accountKey: AccountKey,
): Promise<
    | { success: true; account: SolanaStakingAccount; blockchainUrl: string }
    | { success: false; error: string; message?: string }
> => {
    const account = selectAccountByKey(state, accountKey);

    if (account === null || !isSolanaStakingAccount(account)) {
        return {
            success: false,
            error: 'sign-transaction-failed',
            message: 'Solana account not found.',
        };
    }

    if (!isSupportedSolStakingNetworkSymbol(account.symbol)) {
        return {
            success: false,
            error: 'sign-transaction-failed',
            message: `Staking is not supported for Solana network: ${account.symbol}`,
        };
    }

    const blockchainUrl = await resolveSolanaBlockchainUrl(state, account.symbol);
    if (!blockchainUrl) {
        return {
            success: false,
            error: 'sign-transaction-failed',
            message: `Blockchain backend URL not found for ${account.symbol}.`,
        };
    }

    return { success: true, account, blockchainUrl };
};

export type ComposeSolanaStakingTransactionFeeLevelsThunkState = ResolveSolanaStakingContextState &
    FeesRootState;

export const composeSolanaStakingTransactionFeeLevelsThunk = createThunk<
    PrecomposedLevels | undefined,
    { accountKey: AccountKey; stakeType: StakeType; amount: string; source?: string },
    {
        rejectValue: SolanaStakingComposeRejectValue;
        state: ComposeSolanaStakingTransactionFeeLevelsThunkState;
    }
>(
    `${STAKE_MODULE_PREFIX}/composeSolanaStakingTransactionFeeLevelsThunk`,
    async ({ accountKey, stakeType, amount, source }, { getState, rejectWithValue }) => {
        if (!amount || amount === '0') return undefined;

        const resolved = await resolveSolanaStakingContext(getState(), accountKey);
        if (!resolved.success) {
            return rejectWithValue({ error: resolved.error, message: resolved.message });
        }

        const { account, blockchainUrl } = resolved;

        const feeInfo = selectConvertedNetworkFeeInfo(getState(), account.symbol);
        if (!feeInfo) return undefined;

        return await composeSolanaStakingTransaction({
            formValues: buildSolanaStakeFormState(account, amount, stakeType),
            composeContext: {
                account,
                network: getNetwork(account.symbol),
                feeInfo,
            },
            blockchainUrl,
            userAgent: getSolanaStakingUserAgent(),
            source,
        });
    },
);

export type PreparedSolanaStakingSignContext = {
    account: SolanaStakingAccount;
    txData: Extract<PrepareStakeSolTxResponse, { success: true }>;
    formState: StakeFormState;
};

type PrepareSignFailure = { ok: false; error: SignTransactionError };

const signPrepareFailed = (message?: string): PrepareSignFailure => {
    console.error(`prepareSolanaStakingSignContext: ${message}`);

    return { ok: false, error: { error: 'sign-transaction-failed', message } };
};

// Resolves everything needed to sign a Solana staking transaction: the account and backend URL,
// the sign-time amount taken from the compose result, and the transaction shim built with the
// composed fee. The caller only performs the device call and stores the results.
export const prepareSolanaStakingSignContext = async (
    state: ResolveSolanaStakingContextState,
    {
        accountKey,
        stakeType,
        precomposedTransaction,
        source,
    }: {
        accountKey: AccountKey;
        stakeType: StakeType;
        precomposedTransaction: PrecomposedTransactionFinal;
        source?: string;
    },
): Promise<{ ok: true; context: PreparedSolanaStakingSignContext } | PrepareSignFailure> => {
    const resolved = await resolveSolanaStakingContext(state, accountKey);
    if (!resolved.success) {
        return signPrepareFailed(resolved.message);
    }

    const { account, blockchainUrl } = resolved;

    let amount = '0';

    if (stakeType !== 'claim') {
        const composedAmount = precomposedTransaction.outputs?.[0]?.amount;
        if (!composedAmount || new BigNumber(composedAmount).isLessThanOrEqualTo(0)) {
            return signPrepareFailed(`Compose result for ${stakeType} is missing the amount.`);
        }

        amount = formatNetworkAmount(String(composedAmount), account.symbol);
    }

    const estimatedFee: Fee = {
        feePerTx:
            precomposedTransaction.fee != null ? String(precomposedTransaction.fee) : undefined,
        feeLimit:
            precomposedTransaction.feeLimit != null
                ? String(precomposedTransaction.feeLimit)
                : undefined,
        feePerUnit: String(precomposedTransaction.feePerByte ?? ''),
    };

    const txData = await prepareSolanaStakeTxData({
        from: account.descriptor,
        symbol: account.symbol,
        amount,
        stakeType,
        blockchainUrl,
        userAgent: getSolanaStakingUserAgent(),
        source,
        estimatedFee,
    });

    if (!txData?.success) {
        return signPrepareFailed(txData?.errorMessage);
    }

    const formState: StakeFormState = {
        ...buildSolanaStakeFormState(account, amount, stakeType),
        feePerUnit: String(precomposedTransaction.feePerByte ?? ''),
        feeLimit:
            precomposedTransaction.feeLimit != null ? String(precomposedTransaction.feeLimit) : '',
    };

    return { ok: true, context: { account, txData, formState } };
};

interface ApplySolanaStakingSignatureProps {
    txShim: PreparedSolanaStakingSignContext['txData']['txShim'];
    descriptor: string;
    signature: string;
}

// Attaches the device signature to the prepared transaction
// and returns the serialized transaction ready to broadcast.
export const applySolanaStakingSignature = async ({
    txShim,
    descriptor,
    signature,
}: ApplySolanaStakingSignatureProps) => {
    const { address } = await solana();
    txShim.addSignature(address(descriptor), signature);

    return txShim.serialize();
};
