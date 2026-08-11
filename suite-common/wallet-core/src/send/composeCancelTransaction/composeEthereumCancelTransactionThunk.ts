import { isRejected } from '@reduxjs/toolkit';

import { createThunk } from '@suite-common/redux-utils';
import { getNetwork } from '@suite-common/wallet-config';
import {
    type AccountWithNetworkType,
    type FormState,
    type PrecomposedTransactionFinalCancelRbf,
    type WalletAccountTransactionWithRequiredRbfParams,
} from '@suite-common/wallet-types';
import { isCardanoTx } from '@suite-common/wallet-utils';

import { selectConvertedNetworkFeeInfo } from '../../fees/feesReducer';
import { SEND_MODULE_PREFIX } from '../sendFormConstants';
import { getEthereumRbfFeeInfo } from '../sendFormEthereumThunks';
import { composeSendFormTransactionFeeLevelsThunk } from '../sendFormThunks';
import { type ComposeFeeLevelsError } from '../sendFormTypes';

export type ComposeEthereumCancelTransactionThunkParams = {
    account: AccountWithNetworkType<'ethereum'>;
    tx: WalletAccountTransactionWithRequiredRbfParams;
};

export type ComposedEthereumCancelTransaction = {
    composedCancelTx: PrecomposedTransactionFinalCancelRbf;
    cancelFormState: FormState;
};

/**
 * Composes an EVM cancel transaction: a 0-value transfer to the account's own address reusing the
 * original tx's nonce (via `rbfParams`, applied at signing time) with a fee bumped above the
 * original gas params so the mempool accepts the replacement.
 */
export const composeEthereumCancelTransactionThunk = createThunk<
    ComposedEthereumCancelTransaction,
    ComposeEthereumCancelTransactionThunkParams,
    { rejectValue: ComposeFeeLevelsError }
>(
    `${SEND_MODULE_PREFIX}/composeEthereumCancelTransactionThunk`,
    async ({ account, tx }, { dispatch, getState, rejectWithValue }) => {
        const feeInfo = selectConvertedNetworkFeeInfo(getState(), account.symbol);
        const { rbfParams } = tx;

        if (!feeInfo || rbfParams.type !== 'ethereum') {
            return rejectWithValue({
                error: 'fee-levels-compose-failed',
                message: 'Missing fee info or invalid RBF params for Ethereum cancellation.',
            });
        }

        const cancelFormState: FormState = {
            outputs: [
                {
                    type: 'payment',
                    address: account.descriptor,
                    amount: '0',
                    fiat: '',
                    currency: { value: '', label: '' },
                    token: null,
                },
            ],
            selectedFee: 'normal',
            feePerUnit: '',
            feeLimit: '',
            options: ['broadcast'],
            isCoinControlEnabled: false,
            hasCoinControlBeenOpened: false,
            selectedUtxos: [],
            rbfParams,
        };

        const response = await dispatch(
            composeSendFormTransactionFeeLevelsThunk({
                formState: cancelFormState,
                composeContext: {
                    account,
                    network: getNetwork(account.symbol),
                    feeInfo: getEthereumRbfFeeInfo(feeInfo, rbfParams),
                },
            }),
        );

        if (isRejected(response)) {
            return rejectWithValue(response.payload ?? { error: 'fee-levels-compose-failed' });
        }

        const normalLevel = response.payload.normal;
        if (
            !normalLevel ||
            normalLevel.type === 'error' ||
            normalLevel.type === 'nonfinal' ||
            // The ethereum compose path never yields the Cardano-specific final shape.
            isCardanoTx(account, normalLevel)
        ) {
            return rejectWithValue({
                error: 'fee-levels-compose-failed',
                message: 'Unable to compose a valid cancellation fee level.',
            });
        }

        const composedCancelTx: PrecomposedTransactionFinalCancelRbf = {
            ...normalLevel,
            rbfType: 'cancel',
            prevTxid: tx.txid,
        };

        return { composedCancelTx, cancelFormState };
    },
);
