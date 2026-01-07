import { MetadataAddPayload } from '@suite-common/metadata-types';
import { createThunk } from '@suite-common/redux-utils';
import { RefreshSuiteKeysUnavailableType } from '@suite-common/suite-sync-types/libDev/src';
import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    DeviceCancelledErrType,
    DeviceErrorType,
    asAccountDescriptor,
} from '@suite-common/wallet-types';
import type { StaticSessionId } from '@trezor/connect';
import { Result, exhaustive } from '@trezor/type-utils';

type ProcessMetadataMessageThunkParams = {
    deviceStaticSessionId: StaticSessionId;
    payload: MetadataAddPayload;
    value: string | undefined;
};

/**
 * This is a compatibility thunk to map the old Metadata code to a new Evolu storage.
 *
 * @deprecated This shall be removed, once we phase out the old Metadata code.
 */
export const processLegacyMetadataIntoSuiteSyncThunk = createThunk<
    Result<void, RefreshSuiteKeysUnavailableType | DeviceErrorType | DeviceCancelledErrType>,
    ProcessMetadataMessageThunkParams,
    void
>(
    '@suite/labeling/processMetadataMessageThunk',
    async ({ payload, deviceStaticSessionId, value }, { extra: { services } }) => {
        const labelType = payload.type;

        switch (labelType) {
            case 'walletLabel':
                // Todo: handle errors
                return await services.suiteSync.labeling.updateWalletLabel({
                    deviceStaticSessionId,
                    label: value ?? null,
                });

            case 'accountLabel':
                return await services.suiteSync.labeling.updateAccountLabel({
                    deviceStaticSessionId,
                    accountKey: payload.entityKey,
                    label: value ?? null,
                });

            case 'addressLabel':
                return await services.suiteSync.labeling.updateAddressLabel({
                    deviceStaticSessionId,
                    address: payload.defaultValue, // `payload.defaultValue` is the Address. For example: `"bc1q9mnl3ae6dra54uu2n9hp3d4jwkt0c2ux5l79ja"`
                    // The `payload.entityKey` is something else. For example `zpub6rY6av7j6m7Lnd6rgqw5jffjX2rgeirDWWivEmFDMCKxt7FkWD5XQSrXCSW2Vsh3vnqUo1r9XjoGZiW41jqfEBkrxxdPnS15QhwJFjwfZ1U-btc-momP8m1p6w1nteR3hNREZjNc48buvpPv8K@BCCD2503E021276E78A8EBB2:2`
                    label: value ?? null,
                    accountDescriptor: asAccountDescriptor(payload.accountDescriptor),
                    networkSymbol: payload.networkSymbol as NetworkSymbol,
                });

            case 'outputLabel':
                return await services.suiteSync.labeling.updateOutputLabel({
                    deviceStaticSessionId,
                    txId: payload.txid,
                    outputIndex: Number(payload.outputIndex),
                    label: value ?? null,
                    accountDescriptor: payload.accountDescriptor,
                    networkSymbol: payload.networkSymbol as NetworkSymbol,
                });

            default:
                return exhaustive(labelType);
        }
    },
);
