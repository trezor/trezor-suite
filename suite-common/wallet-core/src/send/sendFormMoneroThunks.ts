import { selectSelectedDevice } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import {
    type Account,
    type ExternalOutput,
    type PrecomposedLevels,
    type PrecomposedTransaction,
} from '@suite-common/wallet-types';
import {
    calculateTotal,
    getExternalComposeOutput,
    tryGetAccountIdentity,
} from '@suite-common/wallet-utils';
import TrezorConnect, { type FeeLevel } from '@trezor/connect';

import { SEND_MODULE_PREFIX } from './sendFormConstants';
import {
    type ComposeFeeLevelsError,
    type ComposeTransactionThunkArguments,
    type SignTransactionError,
    type SignTransactionThunkArguments,
} from './sendFormTypes';
import { fetchAndUpdateAccountThunk } from '../accounts/accountsThunks';

// Key images the device exported while signing a send, kept between the sign step and the after-send
// sync (keyed by account key) so the import reuses them instead of triggering a second device prompt.
// In-memory and short-lived (set on sign, consumed + cleared on the next sync); never persisted.
const pendingMoneroKeyImages = new Map<string, { keyImage: string; signature: string }[]>();

// Drop the images staged for an account without importing them — used when a signed send fails to
// broadcast, so a later unrelated sync can't pick up stale images for a tx that never landed.
export const clearPendingMoneroKeyImages = (accountKey: string) =>
    pendingMoneroKeyImages.delete(accountKey);

const isMaxOutput = (output: ExternalOutput) =>
    output.type === 'send-max' || output.type === 'send-max-noaddress';

// Build the precomposed transaction from the backend's authoritative fee estimate (which ran the same
// input selection + fee math the actual send uses, so the preview can't under-estimate).
const buildPrecomposed = (
    output: ExternalOutput,
    estimate: { fee: string; sufficient: boolean; max: string },
): PrecomposedTransaction => {
    if (!estimate.sufficient) {
        return {
            type: 'error',
            error: 'AMOUNT_IS_NOT_ENOUGH',
            errorMessage: { id: 'AMOUNT_IS_NOT_ENOUGH' },
        } as const;
    }

    const isMax = isMaxOutput(output);
    const amount = isMax ? estimate.max : output.amount;

    const payloadData: PrecomposedTransaction = {
        type: 'nonfinal',
        totalSpent: calculateTotal(amount, estimate.fee),
        // max present ⟺ send-max; the sign step uses it to drive a sweep on the device.
        max: isMax ? estimate.max : undefined,
        fee: estimate.fee,
        feePerByte: '0', // Monero's fee is a total, not per-byte; the device shows the real fee.
        bytes: 0,
        inputs: [],
    };

    if (output.type === 'send-max' || output.type === 'payment') {
        return {
            ...payloadData,
            type: 'final',
            inputs: [],
            outputsPermutation: [0],
            outputs: [{ address: output.address, amount, script_type: 'PAYTOADDRESS' }],
        };
    }

    return payloadData;
};

export const composeMoneroTransactionFeeLevelsThunk = createThunk<
    PrecomposedLevels,
    ComposeTransactionThunkArguments,
    { rejectValue: ComposeFeeLevelsError }
>(
    `${SEND_MODULE_PREFIX}/composeMoneroTransactionFeeLevelsThunk`,
    async ({ formState, composeContext }, { rejectWithValue, fulfillWithValue }) => {
        const { account, network, feeInfo } = composeContext;
        const composedOutput = getExternalComposeOutput(formState, account, network);
        if (!composedOutput) {
            return rejectWithValue({
                error: 'fee-levels-compose-failed',
                message: 'Unable to prepare compose output.',
            });
        }

        const { output } = composedOutput;
        const isMax = isMaxOutput(output);
        const address = 'address' in output ? output.address : account.descriptor;

        // Authoritative fee from the backend (gather + input selection), so the form can't over-commit.
        const estimate = await TrezorConnect.moneroComposeTransaction({
            descriptor: account.descriptor,
            destinations: [{ address, amount: isMax ? '0' : output.amount }],
            isMax,
            identity: tryGetAccountIdentity(account),
        });
        if (!estimate.success) {
            return rejectWithValue({
                error: 'fee-levels-compose-failed',
                message: estimate.error.message,
            });
        }

        const precomposed = buildPrecomposed(output, estimate.payload);
        const resultLevels: PrecomposedLevels = {};
        feeInfo.levels
            .filter(level => level.label !== 'custom')
            .forEach(level => {
                resultLevels[level.label as FeeLevel['label']] =
                    precomposed.type === 'error'
                        ? precomposed
                        : { ...precomposed, feePerByte: level.feePerUnit };
            });

        return fulfillWithValue(resultLevels);
    },
);

export const signMoneroSendFormTransactionThunk = createThunk<
    { serializedTx: string },
    SignTransactionThunkArguments,
    { rejectValue: SignTransactionError }
>(
    `${SEND_MODULE_PREFIX}/signMoneroSendFormTransactionThunk`,
    async ({ precomposedTransaction, selectedAccount, device }, { rejectWithValue }) => {
        if (selectedAccount.networkType !== 'monero') {
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Invalid network type.',
            });
        }
        if (precomposedTransaction.type !== 'final') {
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Invalid transaction.',
            });
        }

        // The compose outputs carry piconero amounts; pass them straight through to the device.
        const destinations = precomposedTransaction.outputs
            .filter(
                (out): out is typeof out & { address: string } => 'address' in out && !!out.address,
            )
            .map(out => ({ address: out.address, amount: String(out.amount) }));

        const response = await TrezorConnect.moneroSendTransaction({
            device: {
                path: device.path,
                instance: device.instance,
                state: device.state,
                useEmptyPassphrase: device.useEmptyPassphrase,
            },
            path: selectedAccount.path,
            descriptor: selectedAccount.descriptor,
            destinations,
            // A send-max precompose carries `max`; sweep the whole balance to the destination.
            isMax: precomposedTransaction.max != null,
            // Sign + validate against the daemon now; the form's push step broadcasts the result.
            doNotRelay: true,
            identity: tryGetAccountIdentity(selectedAccount),
        });

        if (!response.success) {
            return rejectWithValue({
                error: 'sign-transaction-failed',
                errorCode: response.error.code,
                message: response.error.message,
            });
        }

        // Keep the key images the device exported while signing; the after-send sync imports them
        // without a second device prompt (see syncMoneroKeyImagesThunk).
        if (response.payload.keyImages) {
            pendingMoneroKeyImages.set(selectedAccount.key, response.payload.keyImages);
        }

        return { serializedTx: response.payload.txHex };
    },
);

// Sync the wallet's key images with the device, then refresh the account. A view-only Monero wallet
// cannot detect its own spends, so outgoing/self transactions and the true balance stay hidden until
// the device-computed key images are imported (the monero-gui model). One device confirmation;
// the result is cached by the scanning wallet, so a repeat is only needed when new outputs appear.
export const syncMoneroKeyImagesThunk = createThunk<
    { imported: number },
    { account: Account },
    { rejectValue: SignTransactionError }
>(
    `${SEND_MODULE_PREFIX}/syncMoneroKeyImagesThunk`,
    async ({ account }, { dispatch, getState, rejectWithValue, fulfillWithValue }) => {
        if (account.networkType !== 'monero') {
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Not a Monero account.',
            });
        }
        const device = selectSelectedDevice(getState());

        // Reuse the key images the send already exported on the device (device-free import). Without a
        // recent send — a standalone manual sync — this falls back to a device export.
        const cachedKeyImages = pendingMoneroKeyImages.get(account.key);
        pendingMoneroKeyImages.delete(account.key);

        const response = await TrezorConnect.moneroSyncKeyImages({
            device: device && {
                path: device.path,
                instance: device.instance,
                state: device.state,
                useEmptyPassphrase: device.useEmptyPassphrase,
            },
            path: account.path,
            descriptor: account.descriptor,
            identity: tryGetAccountIdentity(account),
            ...(cachedKeyImages ? { keyImages: cachedKeyImages } : {}),
        });

        if (!response.success) {
            return rejectWithValue({
                error: 'sign-transaction-failed',
                errorCode: response.error.code,
                message: response.error.message,
            });
        }

        // Re-fetch so the now-reclassified history (sent/self) and corrected balance show up.
        await dispatch(fetchAndUpdateAccountThunk({ accountKey: account.key }));

        return fulfillWithValue({ imported: response.payload.imported });
    },
);
