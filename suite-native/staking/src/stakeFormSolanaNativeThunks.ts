import { selectSelectedDevice } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import { composeSolanaStakingTransaction, prepareSolanaStakeTxData } from '@suite-common/staking';
import { getNetwork } from '@suite-common/wallet-config';
import {
    pushSendFormTransactionThunk,
    selectAccountByKey,
    selectAddressDisplayType,
    selectConvertedNetworkFeeInfo,
    selectNetworkBlockchainInfo,
    sendFormActions,
} from '@suite-common/wallet-core';
import {
    type AccountKey,
    AddressDisplayOptions,
    type PrecomposedLevels,
    type PrecomposedTransactionFinal,
    type StakeFormState,
} from '@suite-common/wallet-types';
import {
    formatNetworkAmount,
    isSupportedSolStakingNetworkSymbol,
} from '@suite-common/wallet-utils';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import solana from '@trezor/coins-solana/runtime';
import type { Fee } from '@trezor/coins-solana/types';
import TrezorConnect from '@trezor/connect';
import { getSuiteVersion } from '@trezor/env-utils';
import { BigNumber } from '@trezor/utils';

import { STAKE_NATIVE_MODULE_PREFIX } from './constants';
import {
    type SolanaAccount,
    type SolanaStakingComposeRejectValue,
} from './stakeFormSolanaNativeTypes';
import { type SignStakeNativeRejectValue, type StakeNativeType } from './stakeNativeTypes';

const COMPOSE_LOG_PREFIX = 'composeSolanaStakingTransactionFeeLevelsNativeThunk';
const SIGN_LOG_PREFIX = 'signSolanaStakingTransactionNativeThunk';
const getSolanaUserAgent = () => `Trezor Suite ${getSuiteVersion()}`;

// Builds the StakeFormState the shared compose/sign helpers expect. For Solana the output
// "address" is the user's own descriptor (the validator/stake-account is selected internally
// by `prepareStakeSolTx`) and there is no calldata, so `transactionData` stays empty.
const buildSolanaStakeFormState = (
    account: SolanaAccount,
    amount: string,
    stakeType: StakeNativeType,
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

const resolveSolanaStakingContext = (
    state: Parameters<typeof selectAccountByKey>[0] &
        Parameters<typeof selectNetworkBlockchainInfo>[0],
    accountKey: AccountKey,
):
    | { success: true; account: SolanaAccount; blockchainUrl: string }
    | { success: false; error: string; message?: string } => {
    const account = selectAccountByKey(state, accountKey);

    if (account?.networkType !== 'solana') {
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

    const blockchainUrl = selectNetworkBlockchainInfo(state, account.symbol)?.url;
    if (!blockchainUrl) {
        return {
            success: false,
            error: 'sign-transaction-failed',
            message: `Blockchain backend URL not found for ${account.symbol}.`,
        };
    }

    return { success: true, account: account as SolanaAccount, blockchainUrl };
};

export const composeSolanaStakingTransactionFeeLevelsNativeThunk = createThunk<
    PrecomposedLevels | undefined,
    { accountKey: AccountKey; stakeType: StakeNativeType; amount: string },
    { rejectValue: SolanaStakingComposeRejectValue }
>(
    `${STAKE_NATIVE_MODULE_PREFIX}/${COMPOSE_LOG_PREFIX}`,
    async ({ accountKey, stakeType, amount }, { getState, rejectWithValue }) => {
        if (!amount || amount === '0') return undefined;

        const resolved = resolveSolanaStakingContext(getState(), accountKey);
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
            userAgent: getSolanaUserAgent(),
        });
    },
);

export const signSolanaStakingTransactionNativeThunk = createThunk<
    { txid: string },
    {
        accountKey: AccountKey;
        stakeType: StakeNativeType;
        precomposedTransaction: PrecomposedTransactionFinal;
    },
    { rejectValue: SignStakeNativeRejectValue }
>(
    `${STAKE_NATIVE_MODULE_PREFIX}/${SIGN_LOG_PREFIX}`,
    async (
        { accountKey, stakeType, precomposedTransaction },
        { dispatch, getState, rejectWithValue },
    ) => {
        try {
            const resolved = resolveSolanaStakingContext(getState(), accountKey);
            if (!resolved.success) {
                console.error(`${SIGN_LOG_PREFIX}: ${resolved.message}`);

                return rejectWithValue({
                    error: 'sign-transaction-failed',
                    message: resolved.message,
                });
            }

            const { account, blockchainUrl } = resolved;

            let amount = '0';

            if (stakeType !== 'claim') {
                const composedAmount = precomposedTransaction.outputs?.[0]?.amount;
                if (!composedAmount || new BigNumber(composedAmount).isLessThanOrEqualTo(0)) {
                    const message = `Compose result for ${stakeType} is missing the amount.`;
                    console.error(`${SIGN_LOG_PREFIX}: ${message}`);

                    return rejectWithValue({ error: 'sign-transaction-failed', message });
                }

                amount = formatNetworkAmount(String(composedAmount), account.symbol);
            }

            const estimatedFee: Fee = {
                feePerTx:
                    precomposedTransaction.fee != null
                        ? String(precomposedTransaction.fee)
                        : undefined,
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
                userAgent: getSolanaUserAgent(),
                estimatedFee,
            });

            if (!txData?.success) {
                console.error(`${SIGN_LOG_PREFIX}: ${txData?.errorMessage}`);

                return rejectWithValue({
                    error: 'sign-transaction-failed',
                    message: txData?.errorMessage,
                });
            }

            const formState: StakeFormState = {
                ...buildSolanaStakeFormState(account, amount, stakeType),
                feePerUnit: String(precomposedTransaction.feePerByte ?? ''),
                feeLimit:
                    precomposedTransaction.feeLimit != null
                        ? String(precomposedTransaction.feeLimit)
                        : '',
            };

            dispatch(
                sendFormActions.storePrecomposedTransaction({
                    formState,
                    precomposedTransaction,
                    accountKey,
                }),
            );

            const addressDisplayType = selectAddressDisplayType(getState());

            const deviceAccessResponse = await requestPrioritizedDeviceAccess(() => {
                const device = selectSelectedDevice(getState());

                return TrezorConnect.solanaSignTransaction({
                    device: device
                        ? {
                              path: device.path,
                              instance: device.instance,
                              state: device.state,
                              useEmptyPassphrase: device.useEmptyPassphrase,
                          }
                        : undefined,
                    path: account.path,
                    serializedTx: txData.txShim.serializeMessage(),
                    chunkify: addressDisplayType === AddressDisplayOptions.CHUNKED,
                });
            });

            if (!deviceAccessResponse.success) {
                const message = 'Prioritized device access or stake preparation failed.';
                console.error(`${SIGN_LOG_PREFIX}: ${message}`);

                return rejectWithValue({ error: 'sign-transaction-failed', message });
            }

            const signResponse = deviceAccessResponse.payload;

            if (!signResponse.success) {
                if (signResponse.error.message !== 'tx-cancelled') {
                    console.error(
                        `${SIGN_LOG_PREFIX}: Sign transaction failed: ${signResponse.error.message}`,
                    );
                }

                return rejectWithValue({
                    error: 'sign-transaction-failed',
                    errorCode: signResponse.error.code,
                    message: signResponse.error.message,
                });
            }

            const { address } = await solana();
            txData.txShim.addSignature(address(account.descriptor), signResponse.payload.signature);

            dispatch(
                sendFormActions.storeSignedTransaction({
                    serializedTx: { tx: txData.txShim.serialize(), symbol: account.symbol },
                }),
            );

            const pushAction = await dispatch(
                pushSendFormTransactionThunk({
                    selectedAccount: account,
                    isMevProtectionEnabled: false,
                }),
            );

            if (pushSendFormTransactionThunk.rejected.match(pushAction)) {
                const message = pushAction.payload?.metadata.error.message;
                console.error(`${SIGN_LOG_PREFIX}: Push transaction failed: ${message}`);

                return rejectWithValue(pushAction.payload);
            }

            return { txid: pushAction.payload.payload.txid };
        } catch (error) {
            console.error(`${SIGN_LOG_PREFIX}: Unexpected error: ${error}`);

            return rejectWithValue(undefined);
        }
    },
);
