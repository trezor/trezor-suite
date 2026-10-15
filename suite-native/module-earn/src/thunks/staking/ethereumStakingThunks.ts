import { events } from '@suite-common/analytics';
import {
    type FormDraftRootState,
    type PrepareEthereumStakingContextState,
    type SignPreparedEthereumStakingTransactionThunkState,
    WALLET_SDK_SOURCE_MOBILE,
    prepareEthereumStakingContext,
    selectFormDraft,
    sendFormActions,
    signPreparedEthereumStakingTransactionThunk,
} from '@suite-common/wallet-core';
import {
    type AccountKey,
    type BaseStakeType,
    type PrecomposedTransactionFinal,
    type StakeFormState,
} from '@suite-common/wallet-types';
import { getFormDraftKey } from '@suite-common/wallet-utils';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import { type WithServices, createThunk } from '@trezor/redux-utils';

import { EARN_MODULE_PREFIX } from '../../constants';
import { type SignStakeTransactionRejectValue } from '../../types';
import { isUserCancelledSignError } from '../../utils/earn/utils';

const LOG_PREFIX = 'signEthereumStakingTransactionThunk';

export type SignEthereumStakingTransactionThunkState = FormDraftRootState &
    PrepareEthereumStakingContextState &
    SignPreparedEthereumStakingTransactionThunkState;

type SignEthereumStakingTransactionThunkDeps = WithServices<NativeAnalyticsDep>;

export const signEthereumStakingTransactionThunk = createThunk<
    void,
    {
        accountKey: AccountKey;
        stakeType: BaseStakeType;
        precomposedTransaction: PrecomposedTransactionFinal;
    },
    {
        rejectValue: SignStakeTransactionRejectValue;
        state: SignEthereumStakingTransactionThunkState;
        extra: SignEthereumStakingTransactionThunkDeps;
    }
>(
    `${EARN_MODULE_PREFIX}/${LOG_PREFIX}`,
    async ({ accountKey, stakeType, precomposedTransaction }, thunkApi) => {
        const { dispatch, getState, rejectWithValue, extra } = thunkApi;

        try {
            const formValues = selectFormDraft<StakeFormState>(
                getState(),
                getFormDraftKey(stakeType, accountKey),
            );

            if (!formValues) {
                const message = `Compose draft for ${stakeType} is missing.`;
                console.error(`${LOG_PREFIX}: ${message}`);

                return rejectWithValue({ error: 'sign-transaction-failed', message });
            }

            const prepared = prepareEthereumStakingContext(getState(), {
                accountKey,
                stakeType,
                precomposedTransaction,
                formValues,
                source: WALLET_SDK_SOURCE_MOBILE,
            });
            if (!prepared.ok) return rejectWithValue(prepared.error);

            const { account, formState } = prepared.context;

            dispatch(
                sendFormActions.storePrecomposedTransaction({
                    formState,
                    precomposedTransaction,
                    accountKey,
                }),
            );

            const deviceAccessResponse = await requestPrioritizedDeviceAccess(() =>
                dispatch(
                    signPreparedEthereumStakingTransactionThunk({ context: prepared.context }),
                ),
            );

            if (!deviceAccessResponse.success) {
                const message = `Prioritized device access or ${stakeType} preparation failed.`;
                console.error(`${LOG_PREFIX}: ${message}`);

                return rejectWithValue({ error: 'sign-transaction-failed', message });
            }

            const signAction = deviceAccessResponse.payload;

            if (signPreparedEthereumStakingTransactionThunk.rejected.match(signAction)) {
                const { payload } = signAction;

                if (isUserCancelledSignError(payload)) {
                    extra.services.analytics.report({
                        type: events.transactionCancelEvent.name,
                        payload: {
                            txType: 'stake',
                            networkSymbol: account.symbol,
                            stage: 'signing',
                        },
                    });
                }

                if (payload?.error === 'stake-live-state-invalid') {
                    dispatch(sendFormActions.discardTransaction());
                }

                if (payload?.message !== 'tx-cancelled') {
                    console.error(`${LOG_PREFIX}: Sign transaction failed: ${payload?.message}`);
                }

                return rejectWithValue(payload);
            }

            if (!signPreparedEthereumStakingTransactionThunk.fulfilled.match(signAction)) {
                return rejectWithValue(undefined);
            }

            dispatch(
                sendFormActions.storeSignedTransaction({
                    serializedTx: { tx: signAction.payload.serializedTx, symbol: account.symbol },
                }),
            );
        } catch (error) {
            console.error(`${LOG_PREFIX}: Unexpected error: ${error}`);

            return rejectWithValue(undefined);
        }
    },
);
