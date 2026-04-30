import type { PlatformEncryption } from '@suite-common/platform-encryption';
import { createThunk } from '@suite-common/redux-utils';
import {
    selectIsSuiteSyncEnabled,
    selectSuiteSyncOwnerForDeviceStaticId,
} from '@suite-common/suite-sync';
import {
    type SuiteSyncOwnerSecretHex,
    deserializeSuiteSyncOwner,
} from '@suite-common/suite-sync-storage';
import type { SuiteSync } from '@suite-common/suite-sync-types';
import type { WalletDescriptor } from '@suite-common/wallet-types';
import { type Result, err, ok } from '@trezor/type-utils';

import { sparkActions } from './sparkFeatureReducer';
import { createSparkWalletKey } from '../accounts/sparkAccounts';
import { loadSparkWalletSnapshot } from '../sdk/loadSparkWalletSnapshot';
import { paySparkLightningInvoice } from '../sdk/paySparkLightningInvoice';

const actionPrefix = '@suite-common/spark';

type DeviceStaticSessionId = NonNullable<
    Parameters<typeof selectSuiteSyncOwnerForDeviceStaticId>[1]
>;

type SparkWalletThunkParams = {
    accountNumber: number;
    deviceStaticSessionId: DeviceStaticSessionId;
    walletDescriptor: WalletDescriptor;
};

type SparkSendThunkParams = SparkWalletThunkParams & {
    amountSats?: string;
    invoice: string;
};

type SparkThunkError = {
    message: string;
};

type SparkThunkServices = {
    platformEncryption: Pick<PlatformEncryption, 'decrypt'>;
    suiteSync: Pick<SuiteSync, 'ensureWalletSuiteSyncOn' | 'turnOnSuiteSync'>;
};

const mapSuiteSyncError = (error: { message?: string; type: string }) =>
    error.message ?? error.type;

const ensureSparkOwnerSecret = async (
    params: Pick<SparkWalletThunkParams, 'deviceStaticSessionId'>,
    services: SparkThunkServices,
    getState: () => unknown,
): Promise<Result<SuiteSyncOwnerSecretHex, SparkThunkError>> => {
    // eslint-disable-next-line no-restricted-syntax
    const currentState = getState();
    const encryptedOwner = selectSuiteSyncOwnerForDeviceStaticId(
        currentState as never,
        params.deviceStaticSessionId,
    );

    if (encryptedOwner === null) {
        if (!selectIsSuiteSyncEnabled(currentState as never)) {
            const turnOnSuiteSyncResult = await services.suiteSync.turnOnSuiteSync({
                deviceStaticSessionId: params.deviceStaticSessionId,
            });

            if (!turnOnSuiteSyncResult.success) {
                return err({ message: mapSuiteSyncError(turnOnSuiteSyncResult.error) });
            }
        }

        const ensureSuiteSyncResult = await services.suiteSync.ensureWalletSuiteSyncOn({
            deviceStaticSessionId: params.deviceStaticSessionId,
            isWriteMode: false,
        });

        if (!ensureSuiteSyncResult.success) {
            return err({ message: mapSuiteSyncError(ensureSuiteSyncResult.error) });
        }
    }

    const nextEncryptedOwner = selectSuiteSyncOwnerForDeviceStaticId(
        getState() as never,
        params.deviceStaticSessionId,
    );

    if (nextEncryptedOwner === null) {
        return err({ message: 'Suite Sync owner is unavailable for the selected wallet.' });
    }

    const decryptResult = await services.platformEncryption.decrypt({
        value: nextEncryptedOwner,
    });

    if (!decryptResult.success) {
        return err({ message: decryptResult.error.type });
    }

    const suiteSyncOwner = deserializeSuiteSyncOwner(decryptResult.payload);

    return ok(suiteSyncOwner.ownerSecret);
};

export const loadSparkWalletThunk = createThunk<void, SparkWalletThunkParams>(
    `${actionPrefix}/loadSparkWalletThunk`,
    async (params, { dispatch, extra, getState }) => {
        dispatch(
            sparkActions.setSparkWalletLoading({
                accountNumber: params.accountNumber,
                walletDescriptor: params.walletDescriptor,
            }),
        );

        const ownerSecretResult = await ensureSparkOwnerSecret(
            { deviceStaticSessionId: params.deviceStaticSessionId },
            {
                platformEncryption: extra.services.platformEncryption,
                suiteSync: extra.services.suiteSync,
            },
            getState,
        );

        if (!ownerSecretResult.success) {
            dispatch(
                sparkActions.setSparkWalletError({
                    accountNumber: params.accountNumber,
                    error: ownerSecretResult.error.message,
                    walletDescriptor: params.walletDescriptor,
                }),
            );

            return;
        }

        const walletSnapshot = await loadSparkWalletSnapshot({
            accountNumber: params.accountNumber,
            ownerSecret: ownerSecretResult.payload,
            walletKey: createSparkWalletKey(params),
        });

        if (!walletSnapshot.success) {
            dispatch(
                sparkActions.setSparkWalletError({
                    accountNumber: params.accountNumber,
                    error: walletSnapshot.error.message,
                    walletDescriptor: params.walletDescriptor,
                }),
            );

            return;
        }

        dispatch(
            sparkActions.setSparkWalletLoaded({
                accountNumber: params.accountNumber,
                balanceSats: walletSnapshot.payload.balanceSats,
                bitcoinDepositAddress: walletSnapshot.payload.bitcoinDepositAddress,
                lightningInvoice: walletSnapshot.payload.lightningInvoice,
                mnemonic: walletSnapshot.payload.mnemonic as never,
                transfers: walletSnapshot.payload.transfers,
                walletDescriptor: params.walletDescriptor,
            }),
        );
    },
);

export const addSparkAccountThunk = createThunk<void, SparkWalletThunkParams>(
    `${actionPrefix}/addSparkAccountThunk`,
    async (params, { dispatch }) => {
        dispatch(
            sparkActions.addSparkAccount({
                accountNumber: params.accountNumber,
                walletDescriptor: params.walletDescriptor,
            }),
        );
        dispatch(
            sparkActions.selectSparkAccount({
                accountNumber: params.accountNumber,
                walletDescriptor: params.walletDescriptor,
            }),
        );

        await dispatch(loadSparkWalletThunk(params));
    },
);

export const refreshSparkLightningInvoiceThunk = createThunk<void, SparkWalletThunkParams>(
    `${actionPrefix}/refreshSparkLightningInvoiceThunk`,
    async (params, { dispatch }) => {
        await dispatch(loadSparkWalletThunk(params));
    },
);

export const submitSparkLightningSendThunk = createThunk<boolean, SparkSendThunkParams>(
    `${actionPrefix}/submitSparkLightningSendThunk`,
    async (params, { dispatch, extra, getState, fulfillWithValue, rejectWithValue }) => {
        dispatch(
            sparkActions.setSparkWalletLoading({
                accountNumber: params.accountNumber,
                walletDescriptor: params.walletDescriptor,
            }),
        );

        const ownerSecretResult = await ensureSparkOwnerSecret(
            { deviceStaticSessionId: params.deviceStaticSessionId },
            {
                platformEncryption: extra.services.platformEncryption,
                suiteSync: extra.services.suiteSync,
            },
            getState,
        );

        if (!ownerSecretResult.success) {
            dispatch(
                sparkActions.setSparkWalletError({
                    accountNumber: params.accountNumber,
                    error: ownerSecretResult.error.message,
                    walletDescriptor: params.walletDescriptor,
                }),
            );

            return rejectWithValue(false);
        }

        const sendResult = await paySparkLightningInvoice({
            accountNumber: params.accountNumber,
            amountSats: params.amountSats,
            invoice: params.invoice,
            ownerSecret: ownerSecretResult.payload,
            walletKey: createSparkWalletKey(params),
        });

        if (!sendResult.success) {
            dispatch(
                sparkActions.setSparkWalletError({
                    accountNumber: params.accountNumber,
                    error: sendResult.error.message,
                    walletDescriptor: params.walletDescriptor,
                }),
            );

            return rejectWithValue(false);
        }

        await dispatch(loadSparkWalletThunk(params));

        return fulfillWithValue(true);
    },
);
