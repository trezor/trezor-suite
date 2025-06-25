import { MetadataAddPayload } from '@suite-common/metadata-types';
import { createThunk } from '@suite-common/redux-utils';
import type { StaticSessionId } from '@trezor/connect';
import { exhaustive } from '@trezor/type-utils';

import { LABELING_PREFIX } from './labelingActions';
import { updateAccountLabelThunk } from './updateAccountLabelThunk';
import { updateAddressLabelThunk } from './updateAddressLabelThunk';
import { updateOutputLabelThunk } from './updateOutputLabelThunk';
import { updateWalletLabelThunk } from './updateWalletLabelThunk';

type ProcessMetadataMessageThunkParams = {
    deviceStaticSessionId: StaticSessionId;
    payload: MetadataAddPayload;
    value: string | undefined;
};

/**
 * This is a compatibility thunk to map the old Metadata code to a new Evolu storage.
 *
 * This shall be removed, once we phase out the old Metadata code.
 */
export const processMetadataMessageThunk = createThunk<
    void,
    ProcessMetadataMessageThunkParams,
    void
>(
    `${LABELING_PREFIX}/processMetadataMessageThunk`,
    async ({ payload, deviceStaticSessionId, value }, { dispatch }) => {
        const labelType = payload.type;

        switch (labelType) {
            case 'walletLabel':
                await dispatch(
                    updateWalletLabelThunk({ deviceStaticSessionId, label: value ?? null }),
                );
                break;

            case 'accountLabel':
                await dispatch(
                    updateAccountLabelThunk({
                        deviceStaticSessionId,
                        accountKey: payload.entityKey,
                        label: value ?? null,
                    }),
                );
                break;

            case 'addressLabel':
                await dispatch(
                    updateAddressLabelThunk({
                        deviceStaticSessionId,
                        address: payload.defaultValue, // WTF, but yet, this is the address fore example: `"bc1q9mnl3ae6dra54uu2n9hp3d4jwkt0c2ux5l79ja"`
                        // entityKey is for example `zpub6rY6av7j6m7Lnd6rgqw5jffjX2rgeirDWWivEmFDMCKxt7FkWD5XQSrXCSW2Vsh3vnqUo1r9XjoGZiW41jqfEBkrxxdPnS15QhwJFjwfZ1U-btc-momP8m1p6w1nteR3hNREZjNc48buvpPv8K@BCCD2503E021276E78A8EBB2:2`
                        label: value ?? null,
                    }),
                );
                break;

            case 'outputLabel':
                await dispatch(
                    updateOutputLabelThunk({
                        deviceStaticSessionId,
                        txId: payload.txid,
                        outputIndex: Number(payload.outputIndex),
                        label: value ?? null,
                    }),
                );
                break;

            default:
                exhaustive(labelType);
        }
    },
);
