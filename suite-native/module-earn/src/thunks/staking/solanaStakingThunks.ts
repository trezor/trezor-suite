import {
    type ResolveSolanaStakingContextState,
    type SignPreparedSolanaStakingTransactionThunkState,
    WALLET_SDK_SOURCE_MOBILE,
    isEarnSigningCancelled,
    prepareSolanaStakingSignContext,
    sendFormActions,
    signPreparedSolanaStakingTransactionThunk,
} from '@suite-common/wallet-core';
import {
    type AccountKey,
    type BaseStakeType,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import { type WithServices, createThunk } from '@trezor/redux-utils';

import { events } from '@suite-common/analytics';
import { EARN_MODULE_PREFIX } from '../../constants';
import { type SignStakeTransactionRejectValue } from '../../types';

const SIGN_LOG_PREFIX = 'signSolanaStakingTransactionThunk';

export type SignSolanaStakingTransactionThunkState = ResolveSolanaStakingContextState &
    SignPreparedSolanaStakingTransactionThunkState;

type SignSolanaStakingTransactionThunkDeps = WithServices<NativeAnalyticsDep>;

export const signSolanaStakingTransactionThunk = createThunk<
    void,
    {
        accountKey: AccountKey;
        stakeType: BaseStakeType;
        precomposedTransaction: PrecomposedTransactionFinal;
    },
    {
        rejectValue: SignStakeTransactionRejectValue;
        state: SignSolanaStakingTransactionThunkState;
        extra: SignSolanaStakingTransactionThunkDeps;
    }
>(
    `${EARN_MODULE_PREFIX}/${SIGN_LOG_PREFIX}`,
    async (
        { accountKey, stakeType, precomposedTransaction },
        { dispatch, getState, rejectWithValue, extra },
    ) => {
        try {
            const prepared = await prepareSolanaStakingSignContext(getState(), {
                accountKey,
                stakeType,
                precomposedTransaction,
                source: WALLET_SDK_SOURCE_MOBILE,
            });
            if (!prepared.ok) return rejectWithValue(prepared.error);

            const { account, formState } = prepared.context;

            dispatch(
                sendFormActions.storePrecomposedTransaction({
                    formState,
                    precomposedTransaction: {
                        ...precomposedTransaction,
                        createdTimestamp: new Date().getTime(),
                    },
                    accountKey,
                }),
            );

            const deviceAccessResponse = await requestPrioritizedDeviceAccess(() =>
                dispatch(signPreparedSolanaStakingTransactionThunk({ context: prepared.context })),
            );

            if (!deviceAccessResponse.success) {
                const message = 'Prioritized device access or stake preparation failed.';
                console.error(`${SIGN_LOG_PREFIX}: ${message}`);

                return rejectWithValue({ error: 'sign-transaction-failed', message });
            }

            const signAction = deviceAccessResponse.payload;

            if (signPreparedSolanaStakingTransactionThunk.rejected.match(signAction)) {
                if (isEarnSigningCancelled(signAction.error)) {
                    extra.services.analytics.report({
                        type: events.transactionCancelEvent.name,
                        payload: {
                            txType: 'stake',
                            networkSymbol: account.symbol,
                            stage: 'signing',
                        },
                    });
                }
                const { payload } = signAction;

                if (
                    payload?.error !== 'sign-transaction-timeout' &&
                    payload?.message !== 'tx-cancelled'
                ) {
                    console.error(
                        `${SIGN_LOG_PREFIX}: Sign transaction failed: ${payload?.message}`,
                    );
                }

                return rejectWithValue(payload);
            }

            if (!signPreparedSolanaStakingTransactionThunk.fulfilled.match(signAction)) {
                return rejectWithValue(undefined);
            }

            dispatch(
                sendFormActions.storeSignedTransaction({
                    serializedTx: { tx: signAction.payload.serializedTx, symbol: account.symbol },
                }),
            );
        } catch (error) {
            console.error(`${SIGN_LOG_PREFIX}: Unexpected error: ${error}`);

            return rejectWithValue(undefined);
        }
    },
);
